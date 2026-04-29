import { Injectable } from "@nestjs/common";
import * as PrismaClient from "@prisma/client";
import { toEnumOrNull } from "@domain/@shared/utils";
import { AiAgentProfile, AiAgentProfileId } from "@domain/clinical-chat/entities";
import { AiSpecialtyGroup } from "@domain/form-template/entities";
import { MapperWithoutDto } from "@infrastructure/mappers/mapper";

export type AiAgentProfileModel = PrismaClient.AiAgentProfile;

@Injectable()
export class AiAgentProfileMapper extends MapperWithoutDto<AiAgentProfile, AiAgentProfileModel> {
  toDomain(model: AiAgentProfileModel): AiAgentProfile {
    return new AiAgentProfile({
      id: AiAgentProfileId.from(model.id),
      name: model.name,
      code: model.code ?? null,
      slug: model.slug,
      specialtyGroup: toEnumOrNull(AiSpecialtyGroup, model.specialtyGroup),
      description: model.description ?? null,
      baseInstructions: model.baseInstructions ?? null,
      allowedSources: model.allowedSources ?? [],
      contextPriority: model.contextPriority as Record<string, unknown> | null,
      priorityFields: model.priorityFields as Record<string, unknown> | null,
      analysisGoals: model.analysisGoals ?? [],
      blacklistedFields: model.blacklistedFields ?? [],
      guardrails: model.guardrails ?? null,
      responseStyle: model.responseStyle ?? null,
      providerModelId: model.providerModelId ?? null,
      isActive: model.isActive,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      deletedAt: null,
    });
  }

  toPersistence(entity: AiAgentProfile): AiAgentProfileModel {
    return {
      id: entity.id.toString(),
      name: entity.name,
      code: entity.code,
      slug: entity.slug,
      specialtyGroup: entity.specialtyGroup
        ? toEnumOrNull(PrismaClient.AiSpecialtyGroup, entity.specialtyGroup)
        : null,
      description: entity.description,
      baseInstructions: entity.baseInstructions,
      allowedSources: entity.allowedSources,
      contextPriority: entity.contextPriority as PrismaClient.Prisma.JsonValue,
      priorityFields: entity.priorityFields as PrismaClient.Prisma.JsonValue,
      analysisGoals: entity.analysisGoals,
      blacklistedFields: entity.blacklistedFields,
      guardrails: entity.guardrails,
      responseStyle: entity.responseStyle,
      providerModelId: entity.providerModelId,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
