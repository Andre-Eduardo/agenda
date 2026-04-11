import {Injectable} from '@nestjs/common';
import {PatientId} from '../../../domain/patient/entities';
import {ContextChunkSourceType} from '../../../domain/clinical-chat/entities';
import {PatientContextChunkRepository, type RankedChunk} from '../../../domain/clinical-chat/patient-context-chunk.repository';
import {PatientContextSnapshotRepository} from '../../../domain/clinical-chat/patient-context-snapshot.repository';

export type RetrieveChunksInput = {
    patientId: PatientId;
    /** Pergunta do usuário — será usada para busca semântica quando embeddings estiverem ativos. */
    query: string;
    /** Filtrar por tipo de fonte (ex: apenas RECORD, apenas PATIENT_FORM) */
    sourceTypes?: ContextChunkSourceType[];
    /** Número máximo de chunks a retornar (padrão: 10) */
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
 *
 * ESTADO ATUAL: Busca por chunks mais recentes (sem semântica vetorial).
 *
 * PONTO DE INTEGRAÇÃO FUTURA (próxima etapa):
 * 1. Receber `queryEmbedding` gerado pelo provider de embeddings
 * 2. Passar para `chunkRepository.searchSimilar({ queryEmbedding, ... })`
 * 3. Com pgvector, a busca usará cosine similarity sobre os vetores indexados
 * 4. O score retornado será o score real de similaridade semântica
 */
@Injectable()
export class RetrievePatientChunksService {
    constructor(
        private readonly chunkRepository: PatientContextChunkRepository,
        private readonly snapshotRepository: PatientContextSnapshotRepository
    ) {}

    async execute(input: RetrieveChunksInput): Promise<RetrievedContext> {
        const {patientId, sourceTypes, topK = 10, minScore = 0} = input;

        // PONTO DE INTEGRAÇÃO: quando embeddings estiverem disponíveis,
        // gerar queryEmbedding aqui e passar para searchSimilar
        const rankedChunks = await this.chunkRepository.searchSimilar({
            patientId,
            sourceTypes,
            limit: topK,
            minScore,
            // queryEmbedding: await embeddingProvider.embed(query), // próxima etapa
        });

        // Buscar snapshot do paciente para contexto estruturado
        const snapshot = await this.snapshotRepository.findByPatient(patientId);

        const filteredChunks = rankedChunks.filter((rc: RankedChunk) => rc.score >= minScore);

        return {
            chunks: filteredChunks.map(({chunk, score}: RankedChunk) => ({
                id: chunk.id.toString(),
                content: chunk.content,
                sourceType: chunk.sourceType,
                sourceId: chunk.sourceId,
                metadata: chunk.metadata as Record<string, unknown> | null,
                score,
            })),
            snapshot: snapshot
                ? {
                      patientFacts: snapshot.patientFacts as Record<string, unknown>,
                      criticalContext: snapshot.criticalContext as unknown[],
                  }
                : null,
            totalChunks: filteredChunks.length,
        };
    }
}
