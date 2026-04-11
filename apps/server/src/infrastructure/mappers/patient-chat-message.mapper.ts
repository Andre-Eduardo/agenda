import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {PatientChatMessage, PatientChatMessageId, PatientChatSessionId, ChatMessageRole} from '../../domain/clinical-chat/entities';
import {MapperWithoutDto} from './mapper';

export type PatientChatMessageModel = PrismaClient.PatientChatMessage;

@Injectable()
export class PatientChatMessageMapper extends MapperWithoutDto<PatientChatMessage, PatientChatMessageModel> {
    toDomain(model: PatientChatMessageModel): PatientChatMessage {
        return new PatientChatMessage({
            id: PatientChatMessageId.from(model.id),
            sessionId: PatientChatSessionId.from(model.sessionId),
            role: model.role as unknown as ChatMessageRole,
            content: model.content,
            metadata: model.metadata as Record<string, unknown> | null,
            chunkIds: model.chunkIds ?? [],
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: null,
        });
    }

    toPersistence(entity: PatientChatMessage): PatientChatMessageModel {
        return {
            id: entity.id.toString(),
            sessionId: entity.sessionId.toString(),
            role: entity.role as unknown as PrismaClient.ChatMessageRole,
            content: entity.content,
            metadata: entity.metadata as PrismaClient.Prisma.JsonValue,
            chunkIds: entity.chunkIds,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
