import {Injectable} from '@nestjs/common';
import {Appointment} from '../../../domain/appointment/entities';
import {AppointmentRepository} from '../../../domain/appointment/appointment.repository';
import {EventDispatcher} from '../../../domain/event';
import {ApplicationService, Command} from '../../@shared/application.service';
import {AppointmentDto, CreateAppointmentDto} from '../dtos';

@Injectable()
export class CreateAppointmentService implements ApplicationService<CreateAppointmentDto, AppointmentDto> {
    constructor(
        private readonly appointmentRepository: AppointmentRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreateAppointmentDto>): Promise<AppointmentDto> {
        const appointment = Appointment.create(payload);

        await this.appointmentRepository.save(appointment);

        this.eventDispatcher.dispatch(actor, appointment);

        return new AppointmentDto(appointment);
    }
}
