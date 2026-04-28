import {Injectable} from '@nestjs/common';
import {PatientId} from '../../../domain/patient/entities';
import {ContextChunkSourceType} from '../../../domain/clinical-chat/entities';
import {PatientContextChunkRepository, type RankedChunk} from '../../../domain/clinical-chat/patient-context-chunk.repository';
import {PatientContextSnapshotRepository} from '../../../domain/clinical-chat/patient-context-snapshot.repository';
import {AiProviderRegistry} from '../../../domain/clinical-chat/ports/ai-provider-registry.port';
import {ContextPolicyService} from './context-policy.service';

export type RetrieveChunksInput = {
    patientId: PatientId;
    /** Pergunta do usuário — será usada para busca semântica quando embeddings estiverem ativos. */
    query: string;
    /** Filtrar por tipo de fonte (ex: apenas RECORD, apenas PATIENT_FORM) */
    sourceTypes?: ContextChunkSourceType[];
    /**
     * Número máximo de chunks a retornar.
     * Padrão: 5 (política padrão de contexto — Task 15).
     */
    topK?: number;
    /** Score mínimo de relevância 0–1 (padrão: 0) */
    minScore?: number;
};

export type RetrievedContext = {
    chunks: Array<{
        id: string;
        content: string;
        sourceType: ContextChunkSourceType;
        sourceId: string;
        metadata: Record<string, unknown> | null;
        score: number;
        patientId: string;
        chunkIndex: number;
        contentHash: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /** Snapshot do paciente, se disponível */
    snapshot: {
        patientFacts: Record<string, unknown> | null;
        criticalContext: unknown[] | null;
    } | null;
    totalChunks: number;
};

/**
 * Serviço de recuperação de contexto clínico por paciente para RAG.
 *
 * Garante que a recuperação SEMPRE filtra por patientId — nunca mistura pacientes.
 * Lança PreconditionException explicitamente se patientId estiver ausente.
 *
 * O EmbeddingProvider gera o vetor da query para busca semântica por cosine similarity.
 * O ChatProvider NUNCA é chamado aqui — embedding e chat são totalmente desacoplados.
 */
@Injectable()
export class RetrievePatientChunksService {
    constructor(
        private readonly chunkRepository: PatientContextChunkRepository,
        private readonly snapshotRepository: PatientContextSnapshotRepository,
        private readonly aiProviderRegistry: AiProviderRegistry,
        private readonly contextPolicyService: ContextPolicyService,
    ) {}

    async execute(input: RetrieveChunksInput): Promise<RetrievedContext> {
        const {patientId, query, sourceTypes, topK = 5, minScore = 0} = input;

        // ─── Guarda explícito de patientId ────────────────────────────────────
        // Lança PreconditionException em tempo de execução, independente de tipos TypeScript.
        // Nenhuma query ao repositório ou embedding deve acontecer sem este filtro.
        this.contextPolicyService.assertPatientIdRequired(patientId);

        // Gerar embedding da query via EmbeddingProvider (nunca via ChatProvider)
        const embeddingProvider = this.aiProviderRegistry.getEmbeddingProvider();
        const queryEmbedding = await embeddingProvider.generateEmbedding(query);

        const rankedChunks = await this.chunkRepository.searchSimilar({
            patientId,
            sourceTypes,
            limit: topK,
            minScore,
            queryEmbedding,
        });

        // Buscar snapshot do paciente para contexto estruturado
        const snapshot = await this.snapshotRepository.findByPatient(patientId);

        const filteredChunks = rankedChunks.filter((rc: RankedChunk) => rc.score >= minScore);

        // ─── Ordenação combinada: relevância (70%) + recência (30%) ──────────
        // Normaliza as datas dentro do conjunto recuperado para produzir um score
        // de recência entre 0 e 1. Chunks sem eventDate recebem score neutro (0.5).
        const sortedChunks = this.sortByRelevanceAndRecency(filteredChunks);

        return {
            chunks: sortedChunks.map(({chunk, score}: RankedChunk) => ({
                id: chunk.id.toString(),
                content: chunk.content,
                sourceType: chunk.sourceType,
                sourceId: chunk.sourceId,
                metadata: chunk.metadata as Record<string, unknown> | null,
                score,
                patientId: chunk.patientId.toString(),
                chunkIndex: chunk.chunkIndex,
                contentHash: chunk.contentHash,
                createdAt: chunk.createdAt,
                updatedAt: chunk.updatedAt,
            })),
            snapshot: snapshot
                ? {
                      patientFacts: snapshot.patientFacts as Record<string, unknown>,
                      criticalContext: snapshot.criticalContext as unknown[],
                  }
                : null,
            totalChunks: sortedChunks.length,
        };
    }

    /**
     * Re-ranqueia chunks por score combinado: relevância semântica + recência.
     *
     * Fórmula: combinedScore = (score * 0.7) + (recencyScore * 0.3)
     * - relevanceWeight = 0.7 → similaridade semântica é o fator dominante
     * - recencyWeight   = 0.3 → conteúdo mais recente é preferido em empates
     * - recencyScore é normalizado entre 0–1 dentro do conjunto recuperado
     * - Chunks sem metadata.eventDate recebem recencyScore = 0.5 (neutro)
     *
     * Resultado: ordenado pelo combined score decrescente (melhor primeiro).
     */
    private sortByRelevanceAndRecency(chunks: RankedChunk[]): RankedChunk[] {
        if (chunks.length <= 1) return chunks;

        // Coleta timestamps válidos para normalização
        const timestamps = chunks
            .map((rc) => rc.chunk.metadata?.['eventDate'])
            .filter((d): d is string => typeof d === 'string' && d.length > 0)
            .map((d) => new Date(d).getTime())
            .filter((t) => !isNaN(t));

        const minTime = timestamps.length > 0 ? Math.min(...timestamps) : 0;
        const maxTime = timestamps.length > 0 ? Math.max(...timestamps) : 0;
        const timeRange = maxTime > minTime ? maxTime - minTime : 1;

        const withCombined = chunks.map((rc) => {
            const rawDate = rc.chunk.metadata?.['eventDate'];
            let recencyScore = 0.5; // neutro para chunks sem data

            if (typeof rawDate === 'string' && rawDate.length > 0) {
                const t = new Date(rawDate).getTime();

                if (!isNaN(t)) {
                    recencyScore = (t - minTime) / timeRange;
                }
            }

            const combinedScore = rc.score * 0.7 + recencyScore * 0.3;

            return {rc, combinedScore};
        });

        withCombined.sort((a, b) => b.combinedScore - a.combinedScore);

        return withCombined.map(({rc}) => rc);
    }
}
