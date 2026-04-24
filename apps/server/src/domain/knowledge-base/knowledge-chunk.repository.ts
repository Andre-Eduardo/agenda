import type {Specialty} from '../form-template/entities';
import type {KnowledgeChunk, KnowledgeChunkId} from './entities';

export type KnowledgeChunkSearchFilter = {
    queryEmbedding: number[];
    specialty?: Specialty;
    category?: string;
    companyId?: string;
    topK?: number;
    minScore?: number;
};

export type RankedKnowledgeChunk = {
    chunk: KnowledgeChunk;
    score: number;
};

export interface KnowledgeChunkRepository {
    findById(id: KnowledgeChunkId): Promise<KnowledgeChunk | null>;

    searchSimilar(filter: KnowledgeChunkSearchFilter): Promise<RankedKnowledgeChunk[]>;

    save(chunk: KnowledgeChunk): Promise<void>;

    saveBatch(chunks: KnowledgeChunk[]): Promise<void>;

    deleteByCategory(category: string, companyId?: string): Promise<void>;

    deleteBySourceFile(sourceFile: string, companyId?: string): Promise<void>;

    countByCategory(category: string, companyId?: string): Promise<number>;

    findByContentHash(contentHash: string): Promise<KnowledgeChunk | null>;
}

export abstract class KnowledgeChunkRepository {}
