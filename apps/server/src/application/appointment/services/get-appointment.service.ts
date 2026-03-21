import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {AppointmentRepository} from '../../../domain/appointment/appointment.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {AppointmentDto, GetAppointmentDto} from '../dtos';

@Injectable()
export class GetAppointmentService implements ApplicationService<GetAppointmentDto, AppointmentDto> {
    constructor(private readonly appointmentRepository: AppointmentRepository) {}

    async execute({payload}: Command<GetAppointmentDto>): Promise<AppointmentDto> {
        const appointment = await this.appointmentRepository.findById(payload.id);

        if (appointment === null) {
            throw new ResourceNotFoundException('Appointment not found.', payload.id.toString());
        }

        return new AppointmentDto(appointment);
    }
}
