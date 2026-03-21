import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {AppointmentRepository} from '../../../domain/appointment/appointment.repository';
import {EventDispatcher} from '../../../domain/event';
import {ApplicationService, Command} from '../../@shared/application.service';
import {AppointmentDto, UpdateAppointmentDto} from '../dtos';

@Injectable()
export class UpdateAppointmentService implements ApplicationService<UpdateAppointmentDto, AppointmentDto> {
    constructor(
        private readonly appointmentRepository: AppointmentRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload: {id, ...props}}: Command<UpdateAppointmentDto>): Promise<AppointmentDto> {
        const appointment = await this.appointmentRepository.findById(id);

        if (appointment === null) {
            throw new ResourceNotFoundException('Appointment not found.', id.toString());
        }

        appointment.change(props);

        await this.appointmentRepository.save(appointment);

        this.eventDispatcher.dispatch(actor, appointment);

        return new AppointmentDto(appointment);
    }
}
