import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {toEnum} from '../../domain/@shared/utils';
import {ClinicId} from '../../domain/clinic/entities';
import {PatientContextChunk, PatientContextChunkId, ContextChunkSourceType, type ChunkMetadata} from '../../domain/clinical-chat/entities';
import {PatientId} from '../../domain/patient/entities';
import {MapperWithoutDto} from './mapper';

export type PatientContextChunkModel = PrismaClient.PatientContextChunk;

/**
 * Shape retornado por $queryRaw na busca vetorial (colunas snake_case do PostgreSQL).
 * O campo `embedding` é omitido — pgvector retorna o vetor de busca, não o armazenado.
 */
export type PatientContextChunkRawRow = {
    id: string;
    clinic_id: string;
    patient_id: string;
    source_type: string;
    source_id: string;
    content: string;
    metadata: unknown;
    chunk_index: number;
    content_hash: string;
    created_at: Date;
    updated_at: Date;
    score?: number;
};

@Injectable()
export class PatientContextChunkMapper extends MapperWithoutDto<PatientContextChunk, PatientContextChunkModel> {
    toDomain(model: PatientContextChunkModel): PatientContextChunk {
        return new PatientContextChunk({
            id: PatientContextChunkId.from(model.id),
            clinicId: ClinicId.from(model.clinicId),
            patientId: PatientId.from(model.patientId),
            sourceType: toEnum(ContextChunkSourceType, model.sourceType),
            sourceId: model.sourceId,
            content: model.content,
            metadata: model.metadata as ChunkMetadata | null,
            chunkIndex: model.chunkIndex,
            // embedding é Unsupported("vector(1536)") — Prisma retorna null em findMany
            embedding: null,
            contentHash: model.contentHash,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: null,
        });
    }

    /** Mapeia resultado de $queryRaw (snake_case) para entidade de domínio. */
    toDomainFromRaw(row: PatientContextChunkRawRow): PatientContextChunk {
        return new PatientContextChunk({
            id: PatientContextChunkId.from(row.id),
            clinicId: ClinicId.from(row.clinic_id),
            patientId: PatientId.from(row.patient_id),
            sourceType: toEnum(ContextChunkSourceType, row.source_type),
            sourceId: row.source_id,
            content: row.content,
            metadata: row.metadata as ChunkMetadata | null,
            chunkIndex: Number(row.chunk_index),
            // embedding não é selecionado na query de similaridade
            embedding: null,
            contentHash: row.content_hash,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: null,
        });
    }

    toPersistence(entity: PatientContextChunk): Omit<PatientContextChunkModel, 'embedding'> {
        return {
            id: entity.id.toString(),
            clinicId: entity.clinicId.toString(),
            patientId: entity.patientId.toString(),
            sourceType: toEnum(PrismaClient.ContextChunkSourceType, entity.sourceType),
            sourceId: entity.sourceId,
            content: entity.content,
            metadata: entity.metadata as PrismaClient.Prisma.JsonValue,
            chunkIndex: entity.chunkIndex,
            // `embedding` é Unsupported("vector(1536)") — persiste via $executeRaw no repositório
            contentHash: entity.contentHash,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
