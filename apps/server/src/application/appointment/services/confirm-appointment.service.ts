import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {AppointmentDto, ConfirmAppointmentDto} from '@application/appointment/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import {EventDispatcher} from '@domain/event';

@Injectable()
export class ConfirmAppointmentService implements ApplicationService<ConfirmAppointmentDto, AppointmentDto> {
    constructor(
        private readonly appointmentRepository: AppointmentRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload: {id}}: Command<ConfirmAppointmentDto>): Promise<AppointmentDto> {
        const appointment = await this.appointmentRepository.findById(id);

        if (appointment === null) {
            throw new ResourceNotFoundException('Appointment not found.', id.toString());
        }

        appointment.confirm();

        await this.appointmentRepository.save(appointment);

        this.eventDispatcher.dispatch(actor, appointment);

        return new AppointmentDto(appointment);
    }
}
