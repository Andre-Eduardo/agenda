import {Injectable} from '@nestjs/common';
import {PreconditionException, ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {AppointmentRepository} from '../../../domain/appointment/appointment.repository';
import {AppointmentPaymentRepository} from '../../../domain/appointment-payment/appointment-payment.repository';
import {AppointmentPaymentStatus} from '../../../domain/appointment-payment/entities';
import {AppointmentId} from '../../../domain/appointment/entities';
import {EventDispatcher} from '../../../domain/event';
import {ApplicationService, Command} from '../../@shared/application.service';
import {AppointmentPaymentDto, UpdatePaymentStatusDto} from '../dtos';

export type UpdatePaymentStatusCommand = UpdatePaymentStatusDto & {appointmentId: AppointmentId};

@Injectable()
export class UpdatePaymentStatusService implements ApplicationService<UpdatePaymentStatusCommand, AppointmentPaymentDto> {
    constructor(
        private readonly appointmentRepository: AppointmentRepository,
        private readonly appointmentPaymentRepository: AppointmentPaymentRepository,
        private readonly eventDispatcher: EventDispatcher,
    ) {}

    async execute({actor, payload}: Command<UpdatePaymentStatusCommand>): Promise<AppointmentPaymentDto> {
        const {appointmentId, status, paidAt, amountBrl, notes} = payload;

        const appointment = await this.appointmentRepository.findById(appointmentId);
        if (appointment === null) {
            throw new ResourceNotFoundException('Appointment not found.', appointmentId.toString());
        }

        if (!appointment.clinicId.equals(actor.clinicId)) {
            throw new PreconditionException('Appointment does not belong to the current clinic.');
        }

        const payment = await this.appointmentPaymentRepository.findByAppointmentId(appointmentId);
        if (payment === null) {
            throw new ResourceNotFoundException('Payment not found for this appointment.', appointmentId.toString());
        }

        const resolvedPaidAt = paidAt ?? (status === AppointmentPaymentStatus.PAID ? new Date() : payment.paidAt);
        payment.updateStatus(status, resolvedPaidAt ?? null);

        if (amountBrl !== undefined) {
            payment.amountBrl = amountBrl;
        }

        if (notes !== undefined) {
            payment.notes = notes ?? null;
        }

        await this.appointmentPaymentRepository.save(payment);
        this.eventDispatcher.dispatch(actor, payment);

        return new AppointmentPaymentDto(payment);
    }
}
