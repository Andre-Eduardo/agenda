import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { ClinicId } from "@domain/clinic/entities";
import { KnowledgeChunk, KnowledgeChunkId } from "@domain/knowledge-base/entities";
import {
  KnowledgeChunkRepository,
  KnowledgeChunkSearchFilter,
  RankedKnowledgeChunk,
} from "@domain/knowledge-base/knowledge-chunk.repository";
import { KnowledgeChunkMapper } from "@infrastructure/mappers/knowledge-chunk.mapper";
import { PrismaProvider } from "@infrastructure/repository/prisma/prisma.provider";
import { PrismaRepository } from "@infrastructure/repository/prisma.repository";

type RawKnowledgeChunkRow = {
  id: string;
  clinic_id: string | null;
  specialty: string | null;
  category: string;
  content: string;
  metadata: unknown;
  source_file: string | null;
  source_page: number | null;
  content_hash: string;
  created_at: Date;
  updated_at: Date;
  score: number;
};

@Injectable()
export class KnowledgeChunkPrismaRepository
  extends PrismaRepository
  implements KnowledgeChunkRepository
{
  constructor(
    readonly prismaProvider: PrismaProvider,
    private readonly mapper: KnowledgeChunkMapper,
  ) {
    super(prismaProvider);
  }

  async findById(id: KnowledgeChunkId): Promise<KnowledgeChunk | null> {
    const record = await this.prisma.knowledgeChunk.findUnique({
      where: { id: id.toString() },
    });

    return record ? this.mapper.toDomain(record) : null;
  }

  async findByContentHash(contentHash: string): Promise<KnowledgeChunk | null> {
    const record = await this.prisma.knowledgeChunk.findUnique({
      where: { contentHash },
    });

    return record ? this.mapper.toDomain(record) : null;
  }

  async searchSimilar(filter: KnowledgeChunkSearchFilter): Promise<RankedKnowledgeChunk[]> {
    const limit = filter.topK ?? 10;
    const vectorLiteral = `[${filter.queryEmbedding.join(",")}]`;

    const specialtyClause = filter.specialty
      ? Prisma.sql`AND specialty = ${filter.specialty}::specialty`
      : Prisma.empty;

    const categoryClause = filter.category
      ? Prisma.sql`AND category = ${filter.category}`
      : Prisma.empty;

    const clinicClause = filter.clinicId
      ? Prisma.sql`AND (clinic_id = ${filter.clinicId.toString()}::uuid OR clinic_id IS NULL)`
      : Prisma.empty;

    const rows = await this.prisma.$queryRaw<RawKnowledgeChunkRow[]>`
            SELECT
                id,
                clinic_id,
                specialty::text,
                category,
                content,
                metadata,
                source_file,
                source_page,
                content_hash,
                created_at,
                updated_at,
                (1 - (embedding <=> ${vectorLiteral}::vector)) AS score
            FROM knowledge_chunk
            WHERE embedding IS NOT NULL
              ${specialtyClause}
              ${categoryClause}
              ${clinicClause}
            ORDER BY embedding <=> ${vectorLiteral}::vector
            LIMIT ${limit}
        `;

    const minScore = filter.minScore ?? 0;

    return rows
      .filter((row) => row.score >= minScore)
      .map((row) => ({
        chunk: this.mapper.toDomainFromRaw(row),
        score: row.score,
      }));
  }

  async save(chunk: KnowledgeChunk): Promise<void> {
    const data = this.mapper.toPersistence(chunk);
    const writeData = {
      ...data,
      metadata: data.metadata ?? Prisma.JsonNull,
    } satisfies Prisma.KnowledgeChunkUncheckedCreateInput;

    await this.prisma.knowledgeChunk.upsert({
      where: { contentHash: data.contentHash },
      create: writeData,
      update: writeData,
    });

    if (chunk.embedding !== null && chunk.embedding !== undefined) {
      const vectorLiteral = `[${chunk.embedding.join(",")}]`;

      await this.prisma.$executeRaw`
                UPDATE knowledge_chunk
                SET embedding = ${vectorLiteral}::vector(1536)
                WHERE id = ${chunk.id.toString()}::uuid
            `;
    }
  }

  async saveBatch(chunks: KnowledgeChunk[]): Promise<void> {
    await Promise.all(chunks.map((chunk) => this.save(chunk)));
  }

  async deleteByCategory(category: string, clinicId?: ClinicId | null): Promise<void> {
    await this.prisma.knowledgeChunk.deleteMany({
      where: {
        category,
        clinicId: clinicId ? clinicId.toString() : undefined,
      },
    });
  }

  async deleteBySourceFile(sourceFile: string, clinicId?: ClinicId | null): Promise<void> {
    await this.prisma.knowledgeChunk.deleteMany({
      where: {
        sourceFile,
        clinicId: clinicId ? clinicId.toString() : undefined,
      },
    });
  }

  countByCategory(category: string, clinicId?: ClinicId | null): Promise<number> {
    return this.prisma.knowledgeChunk.count({
      where: {
        category,
        clinicId: clinicId ? clinicId.toString() : undefined,
      },
    });
  }
}
