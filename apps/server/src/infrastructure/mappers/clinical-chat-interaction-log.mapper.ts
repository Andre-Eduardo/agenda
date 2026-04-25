import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {toEnum} from '../../domain/@shared/utils';
import {ClinicId} from '../../domain/clinic/entities';
import {
    ClinicalChatInteractionLog,
    ClinicalChatInteractionLogId,
    ChatInteractionStatus,
    AiAgentProfileId,
    PatientChatSessionId,
    PatientContextSnapshotId,
} from '../../domain/clinical-chat/entities';
import {MapperWithoutDto} from './mapper';

export type ClinicalChatInteractionLogModel = PrismaClient.ClinicalChatInteractionLog;

@Injectable()
export class ClinicalChatInteractionLogMapper extends MapperWithoutDto<
    ClinicalChatInteractionLog,
    ClinicalChatInteractionLogModel
> {
    toDomain(model: ClinicalChatInteractionLogModel): ClinicalChatInteractionLog {
        return new ClinicalChatInteractionLog({
            id: ClinicalChatInteractionLogId.from(model.id),
            clinicId: ClinicId.from(model.clinicId),
            sessionId: PatientChatSessionId.from(model.sessionId),
            userMessageId: model.userMessageId,
            assistantMessageId: model.assistantMessageId ?? null,
            providerId: model.providerId ?? null,
            modelId: model.modelId ?? null,
            agentProfileId: model.agentProfileId ? AiAgentProfileId.from(model.agentProfileId) : null,
            agentSlug: model.agentSlug ?? null,
            snapshotId: model.snapshotId ? PatientContextSnapshotId.from(model.snapshotId) : null,
            snapshotVersion: model.snapshotVersion ?? null,
            retrievedChunkIds: model.retrievedChunkIds ?? [],
            promptTokens: model.promptTokens ?? null,
            completionTokens: model.completionTokens ?? null,
            totalTokens: model.totalTokens ?? null,
            latencyMs: model.latencyMs ?? null,
            status: toEnum(ChatInteractionStatus, model.status),
            errorCode: model.errorCode ?? null,
            errorMessage: model.errorMessage ?? null,
            usedFallback: model.usedFallback,
            toolNames: model.toolNames ?? [],
            proposalIds: model.proposalIds ?? [],
            totalIterations: model.totalIterations ?? null,
            ragChunksUsed: model.ragChunksUsed ?? null,
            avgTopKScore: model.avgTopKScore ?? null,
            totalDurationMs: model.totalDurationMs ?? null,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: null,
        });
    }

    toPersistence(entity: ClinicalChatInteractionLog): ClinicalChatInteractionLogModel {
        return {
            id: entity.id.toString(),
            clinicId: entity.clinicId.toString(),
            sessionId: entity.sessionId.toString(),
            userMessageId: entity.userMessageId,
            assistantMessageId: entity.assistantMessageId ?? null,
            providerId: entity.providerId ?? null,
            modelId: entity.modelId ?? null,
            agentProfileId: entity.agentProfileId?.toString() ?? null,
            agentSlug: entity.agentSlug ?? null,
            snapshotId: entity.snapshotId?.toString() ?? null,
            snapshotVersion: entity.snapshotVersion ?? null,
            retrievedChunkIds: entity.retrievedChunkIds,
            promptTokens: entity.promptTokens ?? null,
            completionTokens: entity.completionTokens ?? null,
            totalTokens: entity.totalTokens ?? null,
            latencyMs: entity.latencyMs ?? null,
            status: toEnum(PrismaClient.ChatInteractionStatus, entity.status),
            errorCode: entity.errorCode ?? null,
            errorMessage: entity.errorMessage ?? null,
            usedFallback: entity.usedFallback,
            toolNames: entity.toolNames,
            proposalIds: entity.proposalIds,
            totalIterations: entity.totalIterations ?? null,
            ragChunksUsed: entity.ragChunksUsed ?? null,
            avgTopKScore: entity.avgTopKScore ?? null,
            totalDurationMs: entity.totalDurationMs ?? null,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
