import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {PatientChatSession, PatientChatSessionId, ChatSessionStatus, AiAgentProfileId} from '../../domain/clinical-chat/entities';
import {PatientId} from '../../domain/patient/entities';
import {ProfessionalId} from '../../domain/professional/entities';
import {MapperWithoutDto} from './mapper';

export type PatientChatSessionModel = PrismaClient.PatientChatSession;

@Injectable()
export class PatientChatSessionMapper extends MapperWithoutDto<PatientChatSession, PatientChatSessionModel> {
    toDomain(model: PatientChatSessionModel): PatientChatSession {
        return new PatientChatSession({
            id: PatientChatSessionId.from(model.id),
            patientId: PatientId.from(model.patientId),
            professionalId: ProfessionalId.from(model.professionalId),
            agentProfileId: model.agentProfileId ? AiAgentProfileId.from(model.agentProfileId) : null,
            title: model.title ?? null,
            status: model.status as unknown as ChatSessionStatus,
            lastActivityAt: model.lastActivityAt,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: model.deletedAt ?? null,
        });
    }

    toPersistence(entity: PatientChatSession): PatientChatSessionModel {
        return {
            id: entity.id.toString(),
            patientId: entity.patientId.toString(),
            professionalId: entity.professionalId.toString(),
            agentProfileId: entity.agentProfileId?.toString() ?? null,
            title: entity.title,
            status: entity.status as unknown as PrismaClient.ChatSessionStatus,
            lastActivityAt: entity.lastActivityAt,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt,
        };
    }
}
