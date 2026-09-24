import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {AppointmentDto, GetAppointmentDto} from '@application/appointment/dtos';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {AppointmentPaymentRepository} from '@domain/appointment-payment/appointment-payment.repository';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import {AppointmentPaymentPermission} from '@domain/auth';
import {Authorizer} from '@domain/auth/authorizer';
import {PatientId} from '@domain/patient/entities';

@Injectable()
export class GetAppointmentService implements ApplicationService<GetAppointmentDto, AppointmentDto> {
    constructor(
        private readonly patientAccessChecker: PatientAccessChecker,
        private readonly appointmentRepository: AppointmentRepository,
        private readonly appointmentPaymentRepository: AppointmentPaymentRepository,
        private readonly authorizer: Authorizer
    ) {}

    async execute({actor, payload}: Command<GetAppointmentDto>): Promise<AppointmentDto> {
        const appointment = await this.appointmentRepository.findById(payload.id);

        if (appointment === null) {
            throw new ResourceNotFoundException('Appointment not found.', payload.id.toString());
        }

        assertEntityBelongsToClinic(appointment.clinicId, actor.clinicId);
        await this.patientAccessChecker.assertCanAccess(
            actor,
            PatientId.from(appointment.patientId.toString()),
            'appointment'
        );

        const canViewPayment = await this.authorizer.validate(
            actor.clinicMemberId,
            actor.userId,
            AppointmentPaymentPermission.VIEW
        );
        const payment = canViewPayment ? await this.appointmentPaymentRepository.findByAppointmentId(payload.id) : null;

        return new AppointmentDto(appointment, payment?.status ?? null);
    }
}
