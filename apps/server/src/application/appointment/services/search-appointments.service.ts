import {Injectable} from '@nestjs/common';
import {Actor} from '../../../domain/@shared/actor';
import {AppointmentRepository} from '../../../domain/appointment/appointment.repository';
import {AppointmentPaymentRepository} from '../../../domain/appointment-payment/appointment-payment.repository';
import {PaginatedDto} from '../../@shared/dto';
import {ApplicationService, Command} from '../../@shared/application.service';
import {AppointmentDto, SearchAppointmentsDto} from '../dtos';

@Injectable()
export class SearchAppointmentsService implements ApplicationService<SearchAppointmentsDto, PaginatedDto<AppointmentDto>> {
    constructor(
        private readonly appointmentRepository: AppointmentRepository,
        private readonly appointmentPaymentRepository: AppointmentPaymentRepository,
    ) {}

    async execute({actor, payload}: Command<SearchAppointmentsDto, Actor>): Promise<PaginatedDto<AppointmentDto>> {
        const {term, sort, ...rest} = payload;

        const result = await this.appointmentRepository.search(
            {
                ...rest,
                sort: sort ?? undefined,
            },
            {
                term: term ?? undefined,
                clinicId: actor.clinicId ?? undefined,
            }
        );

        const payments = await this.appointmentPaymentRepository.findByAppointmentIds(
            result.data.map((a) => a.id),
        );
        const paymentByAppointmentId = new Map(payments.map((p) => [p.appointmentId.toString(), p.status]));

        return {
            data: result.data.map((appointment) =>
                new AppointmentDto(appointment, paymentByAppointmentId.get(appointment.id.toString()) ?? null),
            ),
            totalCount: result.totalCount,
        };
    }
}
