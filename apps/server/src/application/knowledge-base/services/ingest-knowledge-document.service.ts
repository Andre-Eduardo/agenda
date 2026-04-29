import { Injectable } from "@nestjs/common";
import { ClinicId } from "@domain/clinic/entities";
import { AiProviderRegistry } from "@domain/clinical-chat/ports/ai-provider-registry.port";
import type { AiSpecialtyGroup } from "@domain/form-template/entities";
import { KnowledgeChunk } from "@domain/knowledge-base/entities";
import { KnowledgeChunkRepository } from "@domain/knowledge-base/knowledge-chunk.repository";
import { ChunkTextService } from "@application/knowledge-base/services/chunk-text.service";

export type IngestKnowledgeDocumentInput = {
  content: string;
  category: string;
  specialty?: AiSpecialtyGroup;
  /** null = global chunk; ClinicId = clinic-private. */
  clinicId?: ClinicId | null;
  sourceFile?: string;
  metadata?: Record<string, unknown>;
};

export type IngestKnowledgeDocumentOutput = {
  chunksCreated: number;
  chunksDeduped: number;
};

@Injectable()
export class IngestKnowledgeDocumentService {
  constructor(
    private readonly chunkTextService: ChunkTextService,
    private readonly knowledgeChunkRepository: KnowledgeChunkRepository,
    private readonly aiProviderRegistry: AiProviderRegistry,
  ) {}

  async execute(input: IngestKnowledgeDocumentInput): Promise<IngestKnowledgeDocumentOutput> {
    const textChunks = this.chunkTextService.execute({ text: input.content });

    if (textChunks.length === 0) {
      return { chunksCreated: 0, chunksDeduped: 0 };
    }

    // Dedup: skip chunks whose contentHash already exists in the database
    const newChunks: KnowledgeChunk[] = [];
    let dedupedCount = 0;

    for (const textChunk of textChunks) {
      const existing = await this.knowledgeChunkRepository.findByContentHash(textChunk.contentHash);

      if (existing) {
        dedupedCount++;

        continue;
      }

      newChunks.push(
        KnowledgeChunk.create({
          clinicId: input.clinicId ?? null,
          specialty: input.specialty ?? null,
          category: input.category,
          content: textChunk.content,
          metadata: input.metadata
            ? {
                title: (input.metadata.title as string | undefined) ?? null,
                section: (input.metadata.section as string | undefined) ?? null,
                tags: (input.metadata.tags as string[] | undefined) ?? null,
                originalFormat: (input.metadata.originalFormat as string | undefined) ?? null,
              }
            : null,
          sourceFile: input.sourceFile ?? null,
          sourcePage: null,
          contentHash: textChunk.contentHash,
        }),
      );
    }

    if (newChunks.length > 0) {
      await this.embedChunks(newChunks);
      await this.knowledgeChunkRepository.saveBatch(newChunks);
    }

    return {
      chunksCreated: newChunks.length,
      chunksDeduped: dedupedCount,
    };
  }

  private async embedChunks(chunks: KnowledgeChunk[]): Promise<void> {
    const embeddingProvider = this.aiProviderRegistry.getEmbeddingProvider();
    const texts = chunks.map((c) => c.content);
    const vectors = await embeddingProvider.generateEmbeddings(texts);

    for (let i = 0; i < chunks.length; i++) {
      chunks[i].setEmbedding(vectors[i]);
    }
  }
}
