import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {ClinicId} from '@domain/clinic/entities';
import {PatientSubscriptionPlan, PatientSubscriptionPlanId} from '@domain/patient-subscription-plan/entities';
import {MapperWithoutDto} from '@infrastructure/mappers/mapper';

export type PatientSubscriptionPlanModel = PrismaClient.PatientSubscriptionPlan;

@Injectable()
export class PatientSubscriptionPlanMapper extends MapperWithoutDto<
    PatientSubscriptionPlan,
    PatientSubscriptionPlanModel
> {
    toDomain(model: PatientSubscriptionPlanModel): PatientSubscriptionPlan {
        return new PatientSubscriptionPlan({
            id: PatientSubscriptionPlanId.from(model.id),
            clinicId: ClinicId.from(model.clinicId),
            name: model.name,
            description: model.description ?? null,
            monthlyAppointmentQuota: model.monthlyAppointmentQuota,
            priceBrl: model.priceBrl,
            isActive: model.isActive,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: model.deletedAt ?? null,
        });
    }

    toPersistence(entity: PatientSubscriptionPlan): PatientSubscriptionPlanModel {
        return {
            id: entity.id.toString(),
            clinicId: entity.clinicId.toString(),
            name: entity.name,
            description: entity.description,
            monthlyAppointmentQuota: entity.monthlyAppointmentQuota,
            priceBrl: entity.priceBrl,
            isActive: entity.isActive,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt ?? null,
        };
    }
}
