import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {toEnum} from '@domain/@shared/utils';
import {ClinicId} from '@domain/clinic/entities';
import {InsurancePlanId} from '@domain/insurance-plan/entities';
import {
    PatientInsuranceEnrollment,
    PatientInsuranceEnrollmentId,
    PatientInsuranceEnrollmentStatus,
} from '@domain/patient-insurance-enrollment/entities';
import {PatientId} from '@domain/patient/entities';
import {MapperWithoutDto} from '@infrastructure/mappers/mapper';

export type PatientInsuranceEnrollmentModel = PrismaClient.PatientInsuranceEnrollment;

@Injectable()
export class PatientInsuranceEnrollmentMapper extends MapperWithoutDto<
    PatientInsuranceEnrollment,
    PatientInsuranceEnrollmentModel
> {
    toDomain(model: PatientInsuranceEnrollmentModel): PatientInsuranceEnrollment {
        return new PatientInsuranceEnrollment({
            id: PatientInsuranceEnrollmentId.from(model.id),
            clinicId: ClinicId.from(model.clinicId),
            patientId: PatientId.from(model.patientId),
            insurancePlanId: InsurancePlanId.from(model.insurancePlanId),
            cardNumber: model.cardNumber ?? null,
            validFrom: model.validFrom ?? null,
            validUntil: model.validUntil ?? null,
            isPrimary: model.isPrimary,
            status: toEnum(PatientInsuranceEnrollmentStatus, model.status),
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: model.deletedAt ?? null,
        });
    }

    toPersistence(entity: PatientInsuranceEnrollment): PatientInsuranceEnrollmentModel {
        return {
            id: entity.id.toString(),
            clinicId: entity.clinicId.toString(),
            patientId: entity.patientId.toString(),
            insurancePlanId: entity.insurancePlanId.toString(),
            cardNumber: entity.cardNumber,
            validFrom: entity.validFrom,
            validUntil: entity.validUntil,
            isPrimary: entity.isPrimary,
            status: entity.status,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt ?? null,
        };
    }
}
