import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {ClinicId} from '@domain/clinic/entities';
import {
    PatientSubscriptionId,
    PatientSubscriptionUsage,
    PatientSubscriptionUsageId,
} from '@domain/patient-subscription/entities';
import {MapperWithoutDto} from '@infrastructure/mappers/mapper';

export type PatientSubscriptionUsageModel = PrismaClient.PatientSubscriptionUsage;

@Injectable()
export class PatientSubscriptionUsageMapper extends MapperWithoutDto<
    PatientSubscriptionUsage,
    PatientSubscriptionUsageModel
> {
    toDomain(model: PatientSubscriptionUsageModel): PatientSubscriptionUsage {
        return new PatientSubscriptionUsage({
            id: PatientSubscriptionUsageId.from(model.id),
            clinicId: ClinicId.from(model.clinicId),
            patientSubscriptionId: PatientSubscriptionId.from(model.patientSubscriptionId),
            periodYear: model.periodYear,
            periodMonth: model.periodMonth,
            appointmentsUsed: model.appointmentsUsed,
            quotaSnapshot: model.quotaSnapshot,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: null,
        });
    }

    toPersistence(entity: PatientSubscriptionUsage): PatientSubscriptionUsageModel {
        return {
            id: entity.id.toString(),
            clinicId: entity.clinicId.toString(),
            patientSubscriptionId: entity.patientSubscriptionId.toString(),
            periodYear: entity.periodYear,
            periodMonth: entity.periodMonth,
            appointmentsUsed: entity.appointmentsUsed,
            quotaSnapshot: entity.quotaSnapshot,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
