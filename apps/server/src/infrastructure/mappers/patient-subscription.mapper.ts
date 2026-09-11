import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {toEnum} from '@domain/@shared/utils';
import {ClinicId} from '@domain/clinic/entities';
import {PatientSubscriptionPlanId} from '@domain/patient-subscription-plan/entities';
import {
    PatientSubscription,
    PatientSubscriptionId,
    PatientSubscriptionStatus,
} from '@domain/patient-subscription/entities';
import {PatientId} from '@domain/patient/entities';
import {MapperWithoutDto} from '@infrastructure/mappers/mapper';

export type PatientSubscriptionModel = PrismaClient.PatientSubscription;

@Injectable()
export class PatientSubscriptionMapper extends MapperWithoutDto<PatientSubscription, PatientSubscriptionModel> {
    toDomain(model: PatientSubscriptionModel): PatientSubscription {
        return new PatientSubscription({
            id: PatientSubscriptionId.from(model.id),
            clinicId: ClinicId.from(model.clinicId),
            patientId: PatientId.from(model.patientId),
            subscriptionPlanId: PatientSubscriptionPlanId.from(model.subscriptionPlanId),
            planNameSnapshot: model.planNameSnapshot,
            monthlyQuotaSnapshot: model.monthlyQuotaSnapshot,
            priceBrlSnapshot: model.priceBrlSnapshot,
            status: toEnum(PatientSubscriptionStatus, model.status),
            currentPeriodStart: model.currentPeriodStart,
            currentPeriodEnd: model.currentPeriodEnd,
            cancelledAt: model.cancelledAt ?? null,
            cancelReason: model.cancelReason ?? null,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: model.deletedAt ?? null,
        });
    }

    toPersistence(entity: PatientSubscription): PatientSubscriptionModel {
        return {
            id: entity.id.toString(),
            clinicId: entity.clinicId.toString(),
            patientId: entity.patientId.toString(),
            subscriptionPlanId: entity.subscriptionPlanId.toString(),
            planNameSnapshot: entity.planNameSnapshot,
            monthlyQuotaSnapshot: entity.monthlyQuotaSnapshot,
            priceBrlSnapshot: entity.priceBrlSnapshot,
            status: entity.status,
            currentPeriodStart: entity.currentPeriodStart,
            currentPeriodEnd: entity.currentPeriodEnd,
            cancelledAt: entity.cancelledAt,
            cancelReason: entity.cancelReason,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt ?? null,
        };
    }
}
