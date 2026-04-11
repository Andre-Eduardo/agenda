import type {PatientId} from '../patient/entities';
import type {ContextChunkSourceType, PatientContextChunk, PatientContextChunkId} from './entities';

export type ChunkRetrievalFilter = {
    patientId: PatientId;
    /** Filtrar por tipo de fonte */
    sourceTypes?: ContextChunkSourceType[];
    /** Filtrar por ID de fonte específica */
    sourceId?: string;
    /** Limitar número de resultados */
    limit?: number;
};

export type SimilaritySearchFilter = ChunkRetrievalFilter & {
    /**
     * Vetor de consulta para busca por similaridade.
     * Plugar na próxima etapa ao ativar pgvector.
     */
    queryEmbedding?: number[];
    /** Score mínimo de similaridade (0–1) */
    minScore?: number;
};

export type RankedChunk = {
    chunk: PatientContextChunk;
    /** Score de relevância — 1.0 para resultados sem embedding ainda */
    score: number;
};

export interface PatientContextChunkRepository {
    findById(id: PatientContextChunkId): Promise<PatientContextChunk | null>;

    /** Lista todos os chunks de um paciente com filtros opcionais. */
    listByPatient(filter: ChunkRetrievalFilter): Promise<PatientContextChunk[]>;

    /**
     * Busca semântica por similaridade de embedding.
     * Sem pgvector: retorna chunks ordenados por data de criação (fallback).
     * Com pgvector: retorna chunks ranqueados por cosine similarity.
     *
     * PONTO DE INTEGRAÇÃO: plugar provider de busca vetorial aqui.
     */
    searchSimilar(filter: SimilaritySearchFilter): Promise<RankedChunk[]>;

    /** Retorna o total de chunks indexados para um paciente. */
    countByPatient(patientId: PatientId): Promise<number>;

    save(chunk: PatientContextChunk): Promise<void>;

    /** Salva múltiplos chunks em batch (upsert por patientId+sourceType+sourceId+chunkIndex). */
    saveBatch(chunks: PatientContextChunk[]): Promise<void>;

    /** Remove todos os chunks de uma fonte específica para permitir re-indexação. */
    deleteBySource(patientId: PatientId, sourceType: ContextChunkSourceType, sourceId: string): Promise<void>;
}

export abstract class PatientContextChunkRepository {}
