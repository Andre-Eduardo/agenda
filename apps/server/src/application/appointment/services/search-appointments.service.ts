import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {PaginatedDto} from '@application/@shared/dto';
import {AppointmentDto, SearchAppointmentsDto} from '@application/appointment/dtos';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import {AppointmentPaymentRepository} from '@domain/appointment-payment/appointment-payment.repository';
import {projectAppointmentRevenue, type RevenuePayment} from '@domain/appointment-payment/appointment-revenue';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import {AppointmentPaymentPermission} from '@domain/auth';
import {Authorizer} from '@domain/auth/authorizer';

@Injectable()
export class SearchAppointmentsService implements ApplicationService<
    SearchAppointmentsDto,
    PaginatedDto<AppointmentDto>
> {
    constructor(
        private readonly appointmentRepository: AppointmentRepository,
        private readonly patientAccessChecker: PatientAccessChecker,
        private readonly appointmentPaymentRepository: AppointmentPaymentRepository,
        private readonly authorizer: Authorizer
    ) {}

    async execute({actor, payload}: Command<SearchAppointmentsDto>): Promise<PaginatedDto<AppointmentDto>> {
        const {term, sort, ...rest} = payload;
        const patientIds = await this.patientAccessChecker.patientIdsForAction(actor, 'appointment');

        if (patientIds !== null && patientIds.length === 0) return {data: [], totalCount: 0};

        const result = await this.appointmentRepository.search(
            {
                ...rest,
                sort: sort ?? undefined,
            },
            {
                term: term ?? undefined,
                clinicId: actor.clinicId ?? undefined,
                patientIds: patientIds ?? undefined,
            }
        );

        const canViewPayment = await this.authorizer.validate(
            actor.clinicMemberId,
            actor.userId,
            AppointmentPaymentPermission.VIEW
        );
        const payments = canViewPayment
            ? await this.appointmentPaymentRepository.findRevenuePayments(
                  actor.clinicId,
                  result.data.map((a) => a.id)
              )
            : new Map<string, RevenuePayment>();

        return {
            data: result.data.map((appointment) => {
                const revenue = canViewPayment
                    ? projectAppointmentRevenue(
                          appointment.status,
                          appointment.procedure?.priceInCents ?? null,
                          payments.get(appointment.id.toString()) ?? null
                      )
                    : null;

                return new AppointmentDto(appointment, revenue);
            }),
            totalCount: result.totalCount,
        };
    }
}
