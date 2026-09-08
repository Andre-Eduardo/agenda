import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {toEnum} from '@domain/@shared/utils';
import {AppointmentPaymentId} from '@domain/appointment-payment/entities';
import {ClinicId} from '@domain/clinic/entities';
import {InsuranceAuthorizationStatus, InsuranceClaim, InsuranceClaimId, InsuranceClaimStatus} from '@domain/insurance-claim/entities';
import {InsurancePlanId} from '@domain/insurance-plan/entities';
import {PatientInsuranceEnrollmentId} from '@domain/patient-insurance-enrollment/entities';
import {MapperWithoutDto} from '@infrastructure/mappers/mapper';

export type InsuranceClaimModel = PrismaClient.InsuranceClaim;

@Injectable()
export class InsuranceClaimMapper extends MapperWithoutDto<InsuranceClaim, InsuranceClaimModel> {
    toDomain(model: InsuranceClaimModel): InsuranceClaim {
        return new InsuranceClaim({
            id: InsuranceClaimId.from(model.id),
            clinicId: ClinicId.from(model.clinicId),
            appointmentPaymentId: AppointmentPaymentId.from(model.appointmentPaymentId),
            patientInsuranceEnrollmentId: PatientInsuranceEnrollmentId.from(model.patientInsuranceEnrollmentId),
            insurancePlanId: InsurancePlanId.from(model.insurancePlanId),
            authorizationCode: model.authorizationCode ?? null,
            authorizationStatus: toEnum(InsuranceAuthorizationStatus, model.authorizationStatus),
            claimStatus: toEnum(InsuranceClaimStatus, model.claimStatus),
            submittedAmountBrl: model.submittedAmountBrl,
            approvedAmountBrl: model.approvedAmountBrl ?? null,
            glosaReason: model.glosaReason ?? null,
            glosaAmountBrl: model.glosaAmountBrl ?? null,
            submittedAt: model.submittedAt ?? null,
            resolvedAt: model.resolvedAt ?? null,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: null,
        });
    }

    toPersistence(entity: InsuranceClaim): InsuranceClaimModel {
        return {
            id: entity.id.toString(),
            clinicId: entity.clinicId.toString(),
            appointmentPaymentId: entity.appointmentPaymentId.toString(),
            patientInsuranceEnrollmentId: entity.patientInsuranceEnrollmentId.toString(),
            insurancePlanId: entity.insurancePlanId.toString(),
            authorizationCode: entity.authorizationCode,
            authorizationStatus: entity.authorizationStatus,
            claimStatus: entity.claimStatus,
            submittedAmountBrl: entity.submittedAmountBrl,
            approvedAmountBrl: entity.approvedAmountBrl,
            glosaReason: entity.glosaReason,
            glosaAmountBrl: entity.glosaAmountBrl,
            submittedAt: entity.submittedAt,
            resolvedAt: entity.resolvedAt,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
