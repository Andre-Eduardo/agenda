import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {toEnum} from '@domain/@shared/utils';
import {AppointmentPaymentId} from '@domain/appointment-payment/entities';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {
    PatientPackageCredit,
    PatientPackageCreditEventType,
    PatientPackageCreditId,
    PatientPackageId,
} from '@domain/patient-package/entities';
import {MapperWithoutDto} from '@infrastructure/mappers/mapper';

export type PatientPackageCreditModel = PrismaClient.PatientPackageCredit;

@Injectable()
export class PatientPackageCreditMapper extends MapperWithoutDto<PatientPackageCredit, PatientPackageCreditModel> {
    toDomain(model: PatientPackageCreditModel): PatientPackageCredit {
        return new PatientPackageCredit({
            id: PatientPackageCreditId.from(model.id),
            clinicId: ClinicId.from(model.clinicId),
            patientPackageId: PatientPackageId.from(model.patientPackageId),
            appointmentPaymentId: model.appointmentPaymentId
                ? AppointmentPaymentId.from(model.appointmentPaymentId)
                : null,
            type: toEnum(PatientPackageCreditEventType, model.type),
            delta: model.delta,
            balanceAfter: model.balanceAfter,
            registeredByMemberId: model.registeredByMemberId ? ClinicMemberId.from(model.registeredByMemberId) : null,
            notes: model.notes ?? null,
            createdAt: model.createdAt,
            updatedAt: model.createdAt,
            deletedAt: null,
        });
    }

    toPersistence(entity: PatientPackageCredit): PatientPackageCreditModel {
        return {
            id: entity.id.toString(),
            clinicId: entity.clinicId.toString(),
            patientPackageId: entity.patientPackageId.toString(),
            appointmentPaymentId: entity.appointmentPaymentId?.toString() ?? null,
            type: entity.type,
            delta: entity.delta,
            balanceAfter: entity.balanceAfter,
            registeredByMemberId: entity.registeredByMemberId?.toString() ?? null,
            notes: entity.notes,
            createdAt: entity.createdAt,
        };
    }
}
