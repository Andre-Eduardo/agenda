import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {toEnum} from '@domain/@shared/utils';
import {ReminderChannel} from '@domain/appointment-reminder/entities';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {
    CommunicationPreferenceSource,
    PatientCommunicationPreferenceChange,
    PatientCommunicationPreferenceChangeId,
} from '@domain/patient-communication-preference/entities';
import {PatientId} from '@domain/patient/entities';
import {MapperWithoutDto} from '@infrastructure/mappers/mapper';

export type PatientCommunicationPreferenceChangeModel = PrismaClient.PatientCommunicationPreferenceChange;

@Injectable()
export class PatientCommunicationPreferenceChangeMapper extends MapperWithoutDto<
    PatientCommunicationPreferenceChange,
    PatientCommunicationPreferenceChangeModel
> {
    toDomain(model: PatientCommunicationPreferenceChangeModel): PatientCommunicationPreferenceChange {
        return new PatientCommunicationPreferenceChange({
            id: PatientCommunicationPreferenceChangeId.from(model.id),
            clinicId: ClinicId.from(model.clinicId),
            patientId: PatientId.from(model.patientId),
            channel: toEnum(ReminderChannel, model.channel),
            optedOut: model.optedOut,
            source: toEnum(CommunicationPreferenceSource, model.source),
            changedByMemberId: model.changedByMemberId === null ? null : ClinicMemberId.from(model.changedByMemberId),
            reason: model.reason ?? null,
            externalId: model.externalId ?? null,
            occurredAt: model.occurredAt,
            createdAt: model.createdAt,
            // Changes are append-only, so they are never updated after creation.
            updatedAt: model.createdAt,
            deletedAt: null,
        });
    }

    toPersistence(entity: PatientCommunicationPreferenceChange): PatientCommunicationPreferenceChangeModel {
        return {
            id: entity.id.toString(),
            clinicId: entity.clinicId.toString(),
            patientId: entity.patientId.toString(),
            channel: toEnum(PrismaClient.ReminderChannel, entity.channel),
            optedOut: entity.optedOut,
            source: toEnum(PrismaClient.CommunicationPreferenceSource, entity.source),
            changedByMemberId: entity.changedByMemberId?.toString() ?? null,
            reason: entity.reason,
            externalId: entity.externalId,
            occurredAt: entity.occurredAt,
            createdAt: entity.createdAt,
        };
    }
}
