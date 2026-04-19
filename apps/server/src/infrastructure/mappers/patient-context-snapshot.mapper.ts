import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {toEnum} from '../../domain/@shared/utils';
import {
    PatientContextSnapshot,
    PatientContextSnapshotId,
    ContextSnapshotStatus,
    type PatientFacts,
    type CriticalContextEntry,
    type TimelineEntry,
} from '../../domain/clinical-chat/entities';
import {PatientId} from '../../domain/patient/entities';
import {ProfessionalId} from '../../domain/professional/entities';
import {MapperWithoutDto} from './mapper';

export type PatientContextSnapshotModel = PrismaClient.PatientContextSnapshot;

@Injectable()
export class PatientContextSnapshotMapper extends MapperWithoutDto<PatientContextSnapshot, PatientContextSnapshotModel> {
    toDomain(model: PatientContextSnapshotModel): PatientContextSnapshot {
        return new PatientContextSnapshot({
            id: PatientContextSnapshotId.from(model.id),
            patientId: PatientId.from(model.patientId),
            professionalId: model.professionalId ? ProfessionalId.from(model.professionalId) : null,
            patientFacts: model.patientFacts as PatientFacts,
            criticalContext: model.criticalContext as CriticalContextEntry[] | null,
            timelineSummary: model.timelineSummary as TimelineEntry[] | null,
            contentHash: model.contentHash,
            status: toEnum(ContextSnapshotStatus, model.status),
            builtAt: model.builtAt ?? null,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: null,
        });
    }

    toPersistence(entity: PatientContextSnapshot): PatientContextSnapshotModel {
        return {
            id: entity.id.toString(),
            patientId: entity.patientId.toString(),
            professionalId: entity.professionalId?.toString() ?? null,
            patientFacts: entity.patientFacts as PrismaClient.Prisma.JsonValue,
            criticalContext: entity.criticalContext as PrismaClient.Prisma.JsonValue,
            timelineSummary: entity.timelineSummary as PrismaClient.Prisma.JsonValue,
            contentHash: entity.contentHash,
            status: toEnum(PrismaClient.ContextSnapshotStatus, entity.status),
            builtAt: entity.builtAt,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
