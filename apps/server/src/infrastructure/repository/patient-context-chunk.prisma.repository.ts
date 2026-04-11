import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {PatientContextChunk, PatientContextChunkId, ContextChunkSourceType} from '../../domain/clinical-chat/entities';
import {
    PatientContextChunkRepository,
    ChunkRetrievalFilter,
    SimilaritySearchFilter,
    RankedChunk,
} from '../../domain/clinical-chat/patient-context-chunk.repository';
import {PatientContextChunkMapper} from '../mappers/patient-context-chunk.mapper';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';
import type {PatientId} from '../../domain/patient/entities';

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
                ? {in: filter.sourceTypes as unknown as PrismaClient.ContextChunkSourceType[]}
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
     * Busca semântica por similaridade.
     *
     * ESTADO ATUAL: Retorna chunks mais recentes como fallback (sem semântica vetorial).
     * Score fixo em 1.0 até pgvector ser ativado.
     *
     * PONTO DE INTEGRAÇÃO (pgvector):
     * Quando pgvector estiver ativo, substituir por:
     * ```sql
     * SELECT *, 1 - (embedding <=> $queryEmbedding::vector) AS score
     * FROM patient_context_chunk
     * WHERE patient_id = $patientId
     * ORDER BY embedding <=> $queryEmbedding::vector
     * LIMIT $limit
     * ```
     * Usando: this.prisma.$queryRaw<...>`SELECT ...`
     */
    async searchSimilar(filter: SimilaritySearchFilter): Promise<RankedChunk[]> {
        const where: PrismaClient.Prisma.PatientContextChunkWhereInput = {
            patientId: filter.patientId.toString(),
            sourceType: filter.sourceTypes
                ? {in: filter.sourceTypes as unknown as PrismaClient.ContextChunkSourceType[]}
                : undefined,
        };

        const records = await this.prisma.patientContextChunk.findMany({
            where,
            take: filter.limit ?? 10,
            orderBy: {createdAt: 'desc'},
        });

        // Retornar com score 1.0 — placeholder até embedding + pgvector
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
        await this.prisma.patientContextChunk.upsert({
            where: {
                patient_context_chunk_unique: {
                    patientId: data.patientId,
                    sourceType: data.sourceType,
                    sourceId: data.sourceId,
                    chunkIndex: data.chunkIndex,
                },
            },
            create: data,
            update: data,
        });
    }

    async saveBatch(chunks: PatientContextChunk[]): Promise<void> {
        // Upsert individual para cada chunk — mantém rastreabilidade
        // Para volumes maiores, considerar createMany com skipDuplicates
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
                sourceType: sourceType as unknown as PrismaClient.ContextChunkSourceType,
                sourceId,
            },
        });
    }
}
