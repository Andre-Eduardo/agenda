import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {Prisma} from '@prisma/client';
import {PatientContextChunk, PatientContextChunkId, ContextChunkSourceType} from '../../domain/clinical-chat/entities';
import {
    PatientContextChunkRepository,
    ChunkRetrievalFilter,
    SimilaritySearchFilter,
    RankedChunk,
} from '../../domain/clinical-chat/patient-context-chunk.repository';
import {toEnum, toEnumArray} from '../../domain/@shared/utils';
import {PatientContextChunkMapper} from '../mappers/patient-context-chunk.mapper';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';
import type {PatientId} from '../../domain/patient/entities';

/** Shape retornado pelo $queryRaw de similaridade (colunas em snake_case do PostgreSQL) */
type RawChunkRow = {
    id: string;
    patient_id: string;
    source_type: string;
    source_id: string;
    content: string;
    metadata: unknown;
    chunk_index: number;
    content_hash: string;
    created_at: Date;
    updated_at: Date;
    score: number;
};

@Injectable()
export class PatientContextChunkPrismaRepository
    extends PrismaRepository
    implements PatientContextChunkRepository
{
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: PatientContextChunkMapper
    ) {
        super(prismaProvider);
    }

    async findById(id: PatientContextChunkId): Promise<PatientContextChunk | null> {
        const record = await this.prisma.patientContextChunk.findUnique({
            where: {id: id.toString()},
        });
        return record ? this.mapper.toDomain(record) : null;
    }

    async listByPatient(filter: ChunkRetrievalFilter): Promise<PatientContextChunk[]> {
        const where: PrismaClient.Prisma.PatientContextChunkWhereInput = {
            patientId: filter.patientId.toString(),
            sourceType: filter.sourceTypes
                ? {in: toEnumArray(PrismaClient.ContextChunkSourceType, filter.sourceTypes)}
                : undefined,
            sourceId: filter.sourceId,
        };

        const records = await this.prisma.patientContextChunk.findMany({
            where,
            take: filter.limit ?? 100,
            orderBy: {createdAt: 'desc'},
        });

        return records.map((r) => this.mapper.toDomain(r));
    }

    /**
     * Busca semântica por similaridade via pgvector cosine distance.
     *
     * Quando `queryEmbedding` é fornecido, executa SQL raw com o operador `<=>` do pgvector
     * e retorna chunks ordenados por score de similaridade (1 - distância coseno).
     *
     * Sem queryEmbedding (fallback), retorna chunks mais recentes com score fixo 1.0.
     */
    async searchSimilar(filter: SimilaritySearchFilter): Promise<RankedChunk[]> {
        const limit = filter.limit ?? 10;

        if (filter.queryEmbedding && filter.queryEmbedding.length > 0) {
            return this.searchByVector(filter, filter.queryEmbedding, limit);
        }

        // Fallback: recency ordering sem semântica vetorial
        return this.searchByRecency(filter, limit);
    }

    private async searchByVector(
        filter: SimilaritySearchFilter,
        queryEmbedding: number[],
        limit: number,
    ): Promise<RankedChunk[]> {
        const patientId = filter.patientId.toString();
        // Formato aceito pelo pgvector: '[1.0,2.0,3.0,...]'
        const vectorLiteral = `[${queryEmbedding.join(',')}]`;

        // Filtro por sourceType opcional — composto com Prisma.sql para segurança
        const sourceTypeClause = filter.sourceTypes && filter.sourceTypes.length > 0
            ? Prisma.sql`AND source_type = ANY(ARRAY[${Prisma.join(
                  filter.sourceTypes.map((t) => Prisma.sql`${t}::context_chunk_source_type`)
              )}])`
            : Prisma.empty;

        const rows = await this.prisma.$queryRaw<RawChunkRow[]>`
            SELECT
                id,
                patient_id,
                source_type,
                source_id,
                content,
                metadata,
                chunk_index,
                content_hash,
                created_at,
                updated_at,
                (1 - (embedding <=> ${vectorLiteral}::vector)) AS score
            FROM patient_context_chunk
            WHERE patient_id = ${patientId}::uuid
              AND embedding IS NOT NULL
              ${sourceTypeClause}
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

    private async searchByRecency(filter: SimilaritySearchFilter, limit: number): Promise<RankedChunk[]> {
        const where: PrismaClient.Prisma.PatientContextChunkWhereInput = {
            patientId: filter.patientId.toString(),
            sourceType: filter.sourceTypes
                ? {in: toEnumArray(PrismaClient.ContextChunkSourceType, filter.sourceTypes)}
                : undefined,
        };

        const records = await this.prisma.patientContextChunk.findMany({
            where,
            take: limit,
            orderBy: {createdAt: 'desc'},
        });

        return records.map((r) => ({
            chunk: this.mapper.toDomain(r),
            score: 1.0,
        }));
    }

    async countByPatient(patientId: PatientId): Promise<number> {
        return this.prisma.patientContextChunk.count({
            where: {patientId: patientId.toString()},
        });
    }

    async save(chunk: PatientContextChunk): Promise<void> {
        const data = this.mapper.toPersistence(chunk);
        // O campo `embedding` é Unsupported("vector(1536)") — o tipo UncheckedCreateInput
        // do Prisma não o inclui (persistido via $executeRaw abaixo). `metadata` precisa
        // de `Prisma.JsonNull` (sentinel) quando null, pois `null` puro é rejeitado.
        const writeData = {
            ...data,
            metadata: data.metadata ?? Prisma.JsonNull,
        } satisfies Prisma.PatientContextChunkUncheckedCreateInput;
        await this.prisma.patientContextChunk.upsert({
            where: {
                patient_context_chunk_unique: {
                    patientId: data.patientId,
                    sourceType: data.sourceType,
                    sourceId: data.sourceId,
                    chunkIndex: data.chunkIndex,
                },
            },
            create: writeData,
            update: writeData,
        });

        // O campo `embedding` é Unsupported("vector(1536)") no schema Prisma —
        // precisa de SQL raw para persistir o vetor após o upsert.
        if (chunk.embedding !== null && chunk.embedding !== undefined) {
            const vectorLiteral = `[${chunk.embedding.join(',')}]`;
            await this.prisma.$executeRaw`
                UPDATE patient_context_chunk
                SET embedding = ${vectorLiteral}::vector(1536)
                WHERE id = ${chunk.id.toString()}::uuid
            `;
        }
    }

    async saveBatch(chunks: PatientContextChunk[]): Promise<void> {
        await Promise.all(chunks.map((chunk) => this.save(chunk)));
    }

    async deleteBySource(
        patientId: PatientId,
        sourceType: ContextChunkSourceType,
        sourceId: string
    ): Promise<void> {
        await this.prisma.patientContextChunk.deleteMany({
            where: {
                patientId: patientId.toString(),
                sourceType: toEnum(PrismaClient.ContextChunkSourceType, sourceType),
                sourceId,
            },
        });
    }
}
