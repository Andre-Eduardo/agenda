import {Injectable} from '@nestjs/common';
import {createHash} from 'crypto';
import {ClinicId} from '../../../domain/clinic/entities';
import {PatientId} from '../../../domain/patient/entities';
import {PatientContextChunk, ContextChunkSourceType} from '../../../domain/clinical-chat/entities';
import {PatientContextChunkRepository} from '../../../domain/clinical-chat/patient-context-chunk.repository';
import {AiProviderRegistry} from '../../../domain/clinical-chat/ports/ai-provider-registry.port';
import type {PatientContextOutput} from './build-patient-context.service';

export type IndexPatientChunksInput = {
    clinicId: ClinicId;
    patientId: PatientId;
    context: PatientContextOutput;
    /** Se true, remove chunks existentes das fontes antes de re-indexar */
    reindex?: boolean;
};

export type IndexPatientChunksOutput = {
    indexed: number;
    skipped: number;
    sources: string[];
};

/**
 * Serviço de chunking e indexação de contexto clínico do paciente.
 *
 * Transforma records e formulários em chunks pesquisáveis vinculados ao patientId.
 * Após gerar os chunks, vetoriza o conteúdo via EmbeddingProvider e persiste o embedding.
 *
 * O EmbeddingProvider é desacoplado do ChatProvider — trocar o modelo de chat
 * nunca afeta os embeddings já indexados.
 */
@Injectable()
export class IndexPatientChunksService {
    constructor(
        private readonly chunkRepository: PatientContextChunkRepository,
        private readonly aiProviderRegistry: AiProviderRegistry
    ) {}

    async execute(input: IndexPatientChunksInput): Promise<IndexPatientChunksOutput> {
        const {clinicId, patientId, context, reindex = false} = input;

        const newChunks: PatientContextChunk[] = [];
        const skippedCount = {value: 0};

        // Indexar records
        for (const record of context.recentRecords) {
            const recordChunks = this.chunkRecord(clinicId, patientId, record);

            if (reindex) {
                await this.chunkRepository.deleteBySource(
                    patientId,
                    ContextChunkSourceType.RECORD,
                    record.id
                );
            }

            newChunks.push(...recordChunks);
        }

        // Indexar formulários
        for (const form of context.relevantForms) {
            const formChunks = this.chunkForm(clinicId, patientId, form);

            if (reindex) {
                await this.chunkRepository.deleteBySource(
                    patientId,
                    ContextChunkSourceType.PATIENT_FORM,
                    form.id
                );
            }

            newChunks.push(...formChunks);
        }

        // Vetorizar chunks em batch via EmbeddingProvider antes de persistir
        if (newChunks.length > 0) {
            await this.embedChunks(newChunks);
            await this.chunkRepository.saveBatch(newChunks);
        }

        return {
            indexed: newChunks.length,
            skipped: skippedCount.value,
            sources: [
                ...context.recentRecords.map((r) => `RECORD:${r.id}`),
                ...context.relevantForms.map((f) => `PATIENT_FORM:${f.id}`),
            ],
        };
    }

    /**
     * Gera embeddings em batch para todos os chunks e os associa via `setEmbedding`.
     * Usa o EmbeddingProvider — nunca o ChatProvider.
     */
    private async embedChunks(chunks: PatientContextChunk[]): Promise<void> {
        const embeddingProvider = this.aiProviderRegistry.getEmbeddingProvider();
        const texts = chunks.map((c) => c.content);
        const vectors = await embeddingProvider.generateEmbeddings(texts);

        for (let i = 0; i < chunks.length; i++) {
            chunks[i].setEmbedding(vectors[i]);
        }
    }

    /**
     * Divide um record em múltiplos chunks por seção SOAP/livre.
     * Cada seção vira um chunk separado para melhor granularidade de recuperação.
     */
    private chunkRecord(
        clinicId: ClinicId,
        patientId: PatientId,
        record: PatientContextOutput['recentRecords'][number],
    ): PatientContextChunk[] {
        const chunks: PatientContextChunk[] = [];

        const sections: Array<{key: string; content: string | null; soapSection?: string}> = [
            {key: 'subjective', content: record.subjective, soapSection: 'subjective'},
            {key: 'objective', content: record.objective, soapSection: 'objective'},
            {key: 'assessment', content: record.assessment, soapSection: 'assessment'},
            {key: 'plan', content: record.plan, soapSection: 'plan'},
            {key: 'freeNotes', content: record.freeNotes, soapSection: 'freeNotes'},
            {key: 'description', content: record.description},
        ];

        let chunkIndex = 0;

        for (const section of sections) {
            if (!section.content?.trim()) continue;

            const normalizedContent = this.normalizeText(section.content);

            if (!normalizedContent) continue;

            const contentHash = this.hashContent(normalizedContent);

            chunks.push(
                PatientContextChunk.create({
                    clinicId,
                    patientId,
                    sourceType: ContextChunkSourceType.RECORD,
                    sourceId: record.id,
                    content: normalizedContent,
                    metadata: {
                        templateType: record.templateType,
                        title: record.title,
                        eventDate: record.eventDate,
                        attendanceType: record.attendanceType,
                        clinicalStatus: record.clinicalStatus,
                        soapSection: section.soapSection ?? null,
                    },
                    chunkIndex,
                    contentHash,
                }),
            );

            chunkIndex++;
        }

        return chunks;
    }

    /**
     * Divide um formulário em chunks por campos indexados.
     * Agrupa campos em blocos para evitar chunks muito pequenos.
     */
    private chunkForm(
        clinicId: ClinicId,
        patientId: PatientId,
        form: PatientContextOutput['relevantForms'][number],
    ): PatientContextChunk[] {
        const chunks: PatientContextChunk[] = [];

        if (form.indexedFields.length === 0) return chunks;

        // Agrupar campos em blocos de 8 para tamanho razoável de chunk
        const fieldBatchSize = 8;

        for (let i = 0; i < form.indexedFields.length; i += fieldBatchSize) {
            const batch = form.indexedFields.slice(i, i + fieldBatchSize);
            const content = batch
                .filter((f) => f.value !== null && f.value !== undefined)
                .map((f) => `${f.fieldLabel ?? 'Campo'}: ${JSON.stringify(f.value)}`)
                .join('\n');

            if (!content.trim()) continue;

            const normalizedContent = this.normalizeText(content);
            const contentHash = this.hashContent(normalizedContent);

            chunks.push(
                PatientContextChunk.create({
                    clinicId,
                    patientId,
                    sourceType: ContextChunkSourceType.PATIENT_FORM,
                    sourceId: form.id,
                    content: normalizedContent,
                    metadata: {
                        specialty: form.specialty,
                        title: `Formulário ${form.templateCode}`,
                        eventDate: form.appliedAt,
                    },
                    chunkIndex: Math.floor(i / fieldBatchSize),
                    contentHash,
                }),
            );
        }

        return chunks;
    }

    /** Remove espaços extras, quebras de linha múltiplas e whitespace desnecessário. */
    private normalizeText(text: string): string {
        return text
            .replaceAll(/\s+/g, ' ')
            .replaceAll(/\n{3,}/g, '\n\n')
            .trim();
    }

    private hashContent(content: string): string {
        return createHash('sha256').update(content).digest('hex').slice(0, 16);
    }
}
