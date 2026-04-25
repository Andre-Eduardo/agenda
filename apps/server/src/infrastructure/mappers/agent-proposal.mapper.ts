import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {toEnum} from '../../domain/@shared/utils';
import {ClinicId} from '../../domain/clinic/entities';
import {ClinicMemberId} from '../../domain/clinic-member/entities';
import {
    AgentProposal,
    AgentProposalId,
    AgentProposalType,
    AgentProposalStatus,
} from '../../domain/agent-proposal/entities';
import {MapperWithoutDto} from './mapper';

export type AgentProposalModel = PrismaClient.AgentProposal;

@Injectable()
export class AgentProposalMapper extends MapperWithoutDto<AgentProposal, AgentProposalModel> {
    toDomain(model: AgentProposalModel): AgentProposal {
        return new AgentProposal({
            id: AgentProposalId.from(model.id),
            clinicId: ClinicId.from(model.clinicId),
            createdByMemberId: ClinicMemberId.from(model.createdByMemberId),
            sessionId: model.sessionId ?? null,
            messageId: model.messageId ?? null,
            patientId: model.patientId ?? null,
            type: toEnum(AgentProposalType, model.proposalType),
            status: toEnum(AgentProposalStatus, model.status),
            payload: model.payload as Record<string, unknown>,
            preview: model.preview as Record<string, unknown>,
            rationale: model.rationale ?? null,
            confidence: model.confidence ?? null,
            resultEntityId: model.resultEntityId ?? null,
            expiresAt: model.expiresAt ?? null,
            confirmedAt: model.confirmedAt ?? null,
            confirmedBy: model.confirmedBy ?? null,
            rejectedAt: model.rejectedAt ?? null,
            rejectionReason: model.rejectionReason ?? null,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: null,
        });
    }

    toPersistence(entity: AgentProposal): AgentProposalModel {
        return {
            id: entity.id.toString(),
            clinicId: entity.clinicId.toString(),
            createdByMemberId: entity.createdByMemberId.toString(),
            sessionId: entity.sessionId,
            messageId: entity.messageId,
            patientId: entity.patientId,
            proposalType: toEnum(PrismaClient.AgentProposalType, entity.type),
            status: toEnum(PrismaClient.AgentProposalStatus, entity.status),
            payload: entity.payload as PrismaClient.Prisma.JsonValue,
            preview: entity.preview as PrismaClient.Prisma.JsonValue,
            rationale: entity.rationale,
            confidence: entity.confidence,
            resultEntityId: entity.resultEntityId,
            expiresAt: entity.expiresAt,
            confirmedAt: entity.confirmedAt,
            confirmedBy: entity.confirmedBy,
            rejectedAt: entity.rejectedAt,
            rejectionReason: entity.rejectionReason,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
