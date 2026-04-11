import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {PatientContextChunk, PatientContextChunkId, ContextChunkSourceType, type ChunkMetadata} from '../../domain/clinical-chat/entities';
import {PatientId} from '../../domain/patient/entities';
import {MapperWithoutDto} from './mapper';

export type PatientContextChunkModel = PrismaClient.PatientContextChunk;

@Injectable()
export class PatientContextChunkMapper extends MapperWithoutDto<PatientContextChunk, PatientContextChunkModel> {
    toDomain(model: PatientContextChunkModel): PatientContextChunk {
        return new PatientContextChunk({
            id: PatientContextChunkId.from(model.id),
            patientId: PatientId.from(model.patientId),
            sourceType: model.sourceType as unknown as ContextChunkSourceType,
            sourceId: model.sourceId,
            content: model.content,
            metadata: model.metadata as ChunkMetadata | null,
            chunkIndex: model.chunkIndex,
            // embedding stored as number[] in JsonB; null if not yet vectorized
            embedding: model.embedding as number[] | null,
            contentHash: model.contentHash,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: null,
        });
    }

    toPersistence(entity: PatientContextChunk): PatientContextChunkModel {
        return {
            id: entity.id.toString(),
            patientId: entity.patientId.toString(),
            sourceType: entity.sourceType as unknown as PrismaClient.ContextChunkSourceType,
            sourceId: entity.sourceId,
            content: entity.content,
            metadata: entity.metadata as PrismaClient.Prisma.JsonValue,
            chunkIndex: entity.chunkIndex,
            embedding: entity.embedding as PrismaClient.Prisma.JsonValue,
            contentHash: entity.contentHash,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
