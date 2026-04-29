import { Injectable } from "@nestjs/common";
import * as PrismaClient from "@prisma/client";
import { toEnum } from "@domain/@shared/utils";
import { ClinicId } from "@domain/clinic/entities";
import {
  PatientChatMessage,
  PatientChatMessageId,
  PatientChatSessionId,
  ChatMessageRole,
} from "@domain/clinical-chat/entities";
import { MapperWithoutDto } from "@infrastructure/mappers/mapper";

export type PatientChatMessageModel = PrismaClient.PatientChatMessage;

@Injectable()
export class PatientChatMessageMapper extends MapperWithoutDto<
  PatientChatMessage,
  PatientChatMessageModel
> {
  toDomain(model: PatientChatMessageModel): PatientChatMessage {
    return new PatientChatMessage({
      id: PatientChatMessageId.from(model.id),
      clinicId: ClinicId.from(model.clinicId),
      sessionId: PatientChatSessionId.from(model.sessionId),
      role: toEnum(ChatMessageRole, model.role),
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
      clinicId: entity.clinicId.toString(),
      sessionId: entity.sessionId.toString(),
      role: toEnum(PrismaClient.ChatMessageRole, entity.role),
      content: entity.content,
      metadata: entity.metadata as PrismaClient.Prisma.JsonValue,
      chunkIds: entity.chunkIds,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
