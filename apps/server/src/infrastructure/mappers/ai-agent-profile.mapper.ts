import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {AiAgentProfile, AiAgentProfileId} from '../../domain/clinical-chat/entities';
import {Specialty} from '../../domain/form-template/entities';
import {MapperWithoutDto} from './mapper';

export type AiAgentProfileModel = PrismaClient.AiAgentProfile;

@Injectable()
export class AiAgentProfileMapper extends MapperWithoutDto<AiAgentProfile, AiAgentProfileModel> {
    toDomain(model: AiAgentProfileModel): AiAgentProfile {
        return new AiAgentProfile({
            id: AiAgentProfileId.from(model.id),
            name: model.name,
            slug: model.slug,
            specialty: model.specialty ? (model.specialty as unknown as Specialty) : null,
            description: model.description ?? null,
            baseInstructions: model.baseInstructions ?? null,
            allowedSources: model.allowedSources ?? [],
            contextPriority: model.contextPriority as Record<string, unknown> | null,
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
            slug: entity.slug,
            specialty: entity.specialty ? (entity.specialty as unknown as PrismaClient.Specialty) : null,
            description: entity.description,
            baseInstructions: entity.baseInstructions,
            allowedSources: entity.allowedSources,
            contextPriority: entity.contextPriority as PrismaClient.Prisma.JsonValue,
            isActive: entity.isActive,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
