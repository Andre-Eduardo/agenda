import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {toEnum} from '@domain/@shared/utils';
import {PaymentMethod} from '@domain/appointment-payment/entities';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {PackagePlanId} from '@domain/package-plan/entities';
import {PatientPackage, PatientPackageId, PatientPackageStatus} from '@domain/patient-package/entities';
import {PatientId} from '@domain/patient/entities';
import {MapperWithoutDto} from '@infrastructure/mappers/mapper';

export type PatientPackageModel = PrismaClient.PatientPackage;

@Injectable()
export class PatientPackageMapper extends MapperWithoutDto<PatientPackage, PatientPackageModel> {
    toDomain(model: PatientPackageModel): PatientPackage {
        return new PatientPackage({
            id: PatientPackageId.from(model.id),
            clinicId: ClinicId.from(model.clinicId),
            patientId: PatientId.from(model.patientId),
            packagePlanId: PackagePlanId.from(model.packagePlanId),
            planNameSnapshot: model.planNameSnapshot,
            totalCredits: model.totalCredits,
            priceBrl: model.priceBrl,
            remainingCredits: model.remainingCredits,
            status: toEnum(PatientPackageStatus, model.status),
            purchasedAt: model.purchasedAt,
            expiresAt: model.expiresAt ?? null,
            paymentMethod: toEnum(PaymentMethod, model.paymentMethod),
            paidAt: model.paidAt ?? null,
            soldByMemberId: ClinicMemberId.from(model.soldByMemberId),
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: model.deletedAt ?? null,
        });
    }

    toPersistence(entity: PatientPackage): PatientPackageModel {
        return {
            id: entity.id.toString(),
            clinicId: entity.clinicId.toString(),
            patientId: entity.patientId.toString(),
            packagePlanId: entity.packagePlanId.toString(),
            planNameSnapshot: entity.planNameSnapshot,
            totalCredits: entity.totalCredits,
            priceBrl: entity.priceBrl,
            remainingCredits: entity.remainingCredits,
            status: entity.status,
            purchasedAt: entity.purchasedAt,
            expiresAt: entity.expiresAt,
            paymentMethod: entity.paymentMethod,
            paidAt: entity.paidAt,
            soldByMemberId: entity.soldByMemberId.toString(),
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt ?? null,
        };
    }
}
