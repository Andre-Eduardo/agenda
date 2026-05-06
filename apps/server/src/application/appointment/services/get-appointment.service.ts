import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {AppointmentDto, GetAppointmentDto} from '@application/appointment/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {AppointmentPaymentRepository} from '@domain/appointment-payment/appointment-payment.repository';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';

@Injectable()
export class GetAppointmentService implements ApplicationService<GetAppointmentDto, AppointmentDto> {
    constructor(
        private readonly appointmentRepository: AppointmentRepository,
        private readonly appointmentPaymentRepository: AppointmentPaymentRepository
    ) {}

    async execute({payload}: Command<GetAppointmentDto>): Promise<AppointmentDto> {
        const appointment = await this.appointmentRepository.findById(payload.id);

        if (appointment === null) {
            throw new ResourceNotFoundException('Appointment not found.', payload.id.toString());
        }

        const payment = await this.appointmentPaymentRepository.findByAppointmentId(payload.id);

        return new AppointmentDto(appointment, payment?.status ?? null);
    }
}
