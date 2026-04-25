import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {toEnum} from '../../domain/@shared/utils';
import {ClinicId} from '../../domain/clinic/entities';
import {ClinicMemberId} from '../../domain/clinic-member/entities';
import {PatientChatSession, PatientChatSessionId, ChatSessionStatus, AiAgentProfileId} from '../../domain/clinical-chat/entities';
import {PatientId} from '../../domain/patient/entities';
import {MapperWithoutDto} from './mapper';

export type PatientChatSessionModel = PrismaClient.PatientChatSession;

@Injectable()
export class PatientChatSessionMapper extends MapperWithoutDto<PatientChatSession, PatientChatSessionModel> {
    toDomain(model: PatientChatSessionModel): PatientChatSession {
        return new PatientChatSession({
            id: PatientChatSessionId.from(model.id),
            clinicId: ClinicId.from(model.clinicId),
            patientId: PatientId.from(model.patientId),
            memberId: ClinicMemberId.from(model.memberId),
            agentProfileId: model.agentProfileId ? AiAgentProfileId.from(model.agentProfileId) : null,
            title: model.title ?? null,
            status: toEnum(ChatSessionStatus, model.status),
            lastActivityAt: model.lastActivityAt,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: model.deletedAt ?? null,
        });
    }

    toPersistence(entity: PatientChatSession): PatientChatSessionModel {
        return {
            id: entity.id.toString(),
            clinicId: entity.clinicId.toString(),
            patientId: entity.patientId.toString(),
            memberId: entity.memberId.toString(),
            agentProfileId: entity.agentProfileId?.toString() ?? null,
            title: entity.title,
            status: toEnum(PrismaClient.ChatSessionStatus, entity.status),
            lastActivityAt: entity.lastActivityAt,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt,
        };
    }
}
