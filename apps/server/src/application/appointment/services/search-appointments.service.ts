import {Injectable} from '@nestjs/common';
import type {ApplicationService, Command} from '@application/@shared/application.service';
import {
    AppointmentListItemDto,
    OperationalAppointmentDto,
    PaginatedAppointmentsDto,
    PaginatedOperationalAppointmentsDto,
    SearchAppointmentsDto,
    SearchOperationalAppointmentsDto,
} from '@application/appointment/dtos';
import {PatientAccessChecker} from '@application/clinic-patient-access/services/patient-access-checker.service';
import {AppointmentPaymentRepository} from '@domain/appointment-payment/appointment-payment.repository';
import {projectAppointmentRevenue, type RevenuePayment} from '@domain/appointment-payment/appointment-revenue';
import {AppointmentRepository} from '@domain/appointment/appointment.repository';
import {AppointmentPaymentPermission} from '@domain/auth';
import {Authorizer} from '@domain/auth/authorizer';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';

@Injectable()
export class SearchAppointmentsService implements ApplicationService<SearchAppointmentsDto, PaginatedAppointmentsDto> {
    constructor(
        private readonly appointmentRepository: AppointmentRepository,
        private readonly patientAccessChecker: PatientAccessChecker,
        private readonly appointmentPaymentRepository: AppointmentPaymentRepository,
        private readonly authorizer: Authorizer,
        private readonly clinicMemberRepository: ClinicMemberRepository
    ) {}

    async execute({actor, payload}: Command<SearchAppointmentsDto>): Promise<PaginatedAppointmentsDto> {
        const result = await this.findVisibleAppointments({actor, payload});

        if (result.data.length === 0) return {data: [], totalCount: result.totalCount};

        const canViewPayment = await this.authorizer.validate(
            actor.clinicMemberId,
            actor.userId,
            AppointmentPaymentPermission.VIEW
        );
        const attendees = new Map(
            result.data.map(({attendedByMemberId}) => [attendedByMemberId.toString(), attendedByMemberId])
        );
        const [payments, attendeeNames] = await Promise.all([
            canViewPayment
                ? this.appointmentPaymentRepository.findRevenuePayments(
                      actor.clinicId,
                      result.data.map((appointment) => appointment.id)
                  )
                : new Map<string, RevenuePayment>(),
            this.clinicMemberRepository.findDisplayNamesByIds(actor.clinicId, [...attendees.values()]),
        ]);

        return {
            data: result.data.map((appointment) => {
                const revenue = canViewPayment
                    ? projectAppointmentRevenue(
                          appointment.status,
                          appointment.procedure?.priceInCents ?? null,
                          payments.get(appointment.id.toString()) ?? null
                      )
                    : null;

                return new AppointmentListItemDto(
                    appointment,
                    revenue,
                    attendeeNames.get(appointment.attendedByMemberId.toString()) ?? null
                );
            }),
            totalCount: result.totalCount,
        };
    }

    async searchOperational(
        command: Command<SearchOperationalAppointmentsDto>
    ): Promise<PaginatedOperationalAppointmentsDto> {
        const {data, totalCount} = await this.findVisibleAppointments(command);

        return {
            data: data.map((appointment) => new OperationalAppointmentDto(appointment)),
            totalCount,
        };
    }

    private async findVisibleAppointments({actor, payload}: Command<SearchAppointmentsDto>) {
        const {term, sort, dateFrom, dateTo, ...pagination} = payload;
        const patientIds = await this.patientAccessChecker.patientIdsForAction(actor, 'appointment');

        if (patientIds !== null && patientIds.length === 0) return {data: [], totalCount: 0};

        return this.appointmentRepository.search(
            {...pagination, sort: sort ?? undefined},
            {
                clinicId: actor.clinicId,
                patientIds: patientIds ?? undefined,
                term: term ?? undefined,
                dateFrom,
                dateTo,
            }
        );
    }
}
