import type { ClinicId } from "@domain/clinic/entities";
import type { AiSpecialtyGroup } from "@domain/form-template/entities";
import type { KnowledgeChunk, KnowledgeChunkId } from "@domain/knowledge-base/entities";

export type KnowledgeChunkSearchFilter = {
  queryEmbedding: number[];
  specialty?: AiSpecialtyGroup;
  category?: string;
  clinicId?: ClinicId | null;
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

  deleteByCategory(category: string, clinicId?: ClinicId | null): Promise<void>;

  deleteBySourceFile(sourceFile: string, clinicId?: ClinicId | null): Promise<void>;

  countByCategory(category: string, clinicId?: ClinicId | null): Promise<number>;

  findByContentHash(contentHash: string): Promise<KnowledgeChunk | null>;
}

export abstract class KnowledgeChunkRepository {}
