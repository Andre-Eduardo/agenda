import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {
    AppointmentPayment,
    AppointmentPaymentId,
    AppointmentPaymentStatus,
    PaymentMethod,
} from '../../domain/appointment-payment/entities';
import {ClinicId} from '../../domain/clinic/entities';
import {ClinicMemberId} from '../../domain/clinic-member/entities';
import {PatientId} from '../../domain/patient/entities';
import {AppointmentId} from '../../domain/appointment/entities';
import {InsurancePlanId} from '../../domain/insurance-plan/entities';
import {toEnum} from '../../domain/@shared/utils';
import {MapperWithoutDto} from './mapper';

export type AppointmentPaymentModel = PrismaClient.AppointmentPayment;

@Injectable()
export class AppointmentPaymentMapper extends MapperWithoutDto<AppointmentPayment, AppointmentPaymentModel> {
    toDomain(model: AppointmentPaymentModel): AppointmentPayment {
        return new AppointmentPayment({
            ...model,
            id: AppointmentPaymentId.from(model.id),
            clinicId: ClinicId.from(model.clinicId),
            appointmentId: AppointmentId.from(model.appointmentId),
            patientId: PatientId.from(model.patientId),
            registeredByMemberId: ClinicMemberId.from(model.registeredByMemberId),
            paymentMethod: toEnum(PaymentMethod, model.paymentMethod),
            status: toEnum(AppointmentPaymentStatus, model.status),
            amountBrl: model.amountBrl,
            paidAt: model.paidAt ?? null,
            insurancePlanId: model.insurancePlanId ? InsurancePlanId.from(model.insurancePlanId) : null,
            insuranceAuthCode: model.insuranceAuthCode ?? null,
            notes: model.notes ?? null,
            deletedAt: null,
        });
    }

    toPersistence(entity: AppointmentPayment): AppointmentPaymentModel {
        return {
            id: entity.id.toString(),
            clinicId: entity.clinicId.toString(),
            appointmentId: entity.appointmentId.toString(),
            patientId: entity.patientId.toString(),
            registeredByMemberId: entity.registeredByMemberId.toString(),
            paymentMethod: entity.paymentMethod,
            status: entity.status,
            amountBrl: entity.amountBrl,
            paidAt: entity.paidAt,
            insurancePlanId: entity.insurancePlanId?.toString() ?? null,
            insuranceAuthCode: entity.insuranceAuthCode,
            notes: entity.notes,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt ?? null,
        };
    }
}
