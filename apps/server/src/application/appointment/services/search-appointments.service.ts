import {Injectable} from '@nestjs/common';
import {Actor} from '../../../domain/@shared/actor';
import {AppointmentRepository} from '../../../domain/appointment/appointment.repository';
import {PaginatedDto} from '../../@shared/dto';
import {ApplicationService, Command} from '../../@shared/application.service';
import {AppointmentDto, SearchAppointmentsDto} from '../dtos';

@Injectable()
export class SearchAppointmentsService implements ApplicationService<SearchAppointmentsDto, PaginatedDto<AppointmentDto>> {
    constructor(private readonly appointmentRepository: AppointmentRepository) {}

    async execute({actor, payload}: Command<SearchAppointmentsDto, Actor>): Promise<PaginatedDto<AppointmentDto>> {
        const {term, sort, ...rest} = payload;

        const result = await this.appointmentRepository.search(
            {
                ...rest,
                sort: sort ?? undefined,
            },
            {
                term: term ?? undefined,
                professionalId: actor.clinicMemberId ?? undefined,
            }
        );

        return {
            data: result.data.map((appointment) => new AppointmentDto(appointment)),
            totalCount: result.totalCount,
        };
    }
}
