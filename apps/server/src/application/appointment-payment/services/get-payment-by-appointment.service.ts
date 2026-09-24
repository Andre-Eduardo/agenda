import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {assertEntityBelongsToClinic} from '@application/@shared/validators/cross-tenant.validator';
import {AppointmentPaymentDto} from '@application/appointment-payment/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {AppointmentPaymentRepository} from '@domain/appointment-payment/appointment-payment.repository';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import {AppointmentId} from '@domain/appointment/entities';

export type GetPaymentByAppointmentCommand = {appointmentId: AppointmentId};

@Injectable()
export class GetPaymentByAppointmentService implements ApplicationService<
    GetPaymentByAppointmentCommand,
    AppointmentPaymentDto
> {
    constructor(
        private readonly appointmentRepository: AppointmentRepository,
        private readonly appointmentPaymentRepository: AppointmentPaymentRepository
    ) {}

    async execute({actor, payload}: Command<GetPaymentByAppointmentCommand>): Promise<AppointmentPaymentDto> {
        const {appointmentId} = payload;

        const appointment = await this.appointmentRepository.findById(appointmentId);

        if (appointment === null) {
            throw new ResourceNotFoundException('Appointment not found.', appointmentId.toString());
        }

        assertEntityBelongsToClinic(appointment.clinicId, actor.clinicId);

        const payment = await this.appointmentPaymentRepository.findByAppointmentId(appointmentId);

        if (payment === null) {
            throw new ResourceNotFoundException('Payment not found for this appointment.', appointmentId.toString());
        }

        return new AppointmentPaymentDto(payment);
    }
}
