import {Injectable} from '@nestjs/common';
import {
    AccessDeniedException,
    AccessDeniedReason,
    InvalidInputException,
    ResourceNotFoundException,
} from '@domain/@shared/exceptions';
import {toEnum} from '@domain/@shared/utils';
import {
    isPrepaidAppointmentMethod,
    projectAppointmentRevenue,
    type AppointmentRevenue,
} from '@domain/appointment-payment/appointment-revenue';
import {brl} from '@domain/appointment-payment/brl';
import {AppointmentPaymentStatus, PaymentMethod} from '@domain/appointment-payment/entities';
import {AppointmentStatus} from '@domain/appointment/entities';
import {revenuePaymentSelect, toRevenuePayment} from '@infrastructure/mappers/appointment-revenue.mapper';
import {PrismaProvider} from '@infrastructure/repository/prisma/prisma.provider';

export type RevenueReportFilters = {
    startDate: Date;
    endDate: Date;
    professionalMemberId?: string;
    paymentMethod?: PaymentMethod;
    status?: AppointmentPaymentStatus;
    page?: number;
    pageSize?: number;
};

export type PaymentMethodSummary = {
    method: PaymentMethod;
    count: number;
    totalBrl: number;
};

export type ProfessionalSummary = {
    memberId: string;
    displayName: string;
    count: number;
    totalBrl: number;
};

export type PaymentListItem = AppointmentRevenue & {
    paymentId: string | null;
    professionalMemberId: string;
    procedureName: string | null;
    appointmentId: string;
    patientName: string;
    professionalName: string;
    appointmentDate: string;
    amountBrl: number;
    insurancePlanName: string | null;
};

export type RevenueSummary = {
    totalBrl: number;
    totalPaid: number;
    totalPending: number;
    totalExempt: number;
    totalRefunded: number;
    appointmentCount: number;
    avgTicketBrl: number;
};

export type RevenueReport = {
    period: {startDate: string; endDate: string};
    filters: {
        professionalMemberId?: string;
        paymentMethod?: PaymentMethod;
        status?: AppointmentPaymentStatus;
    };
    summary: RevenueSummary;
    byPaymentMethod: PaymentMethodSummary[];
    byProfessional: ProfessionalSummary[];
    payments: PaymentListItem[];
    pagination: {page: number; pageSize: number; total: number};
};

export type RevenueSummaryReport = {
    period: {startDate: string; endDate: string};
    filters: {
        professionalMemberId?: string;
        paymentMethod?: PaymentMethod;
        status?: AppointmentPaymentStatus;
    };
    summary: RevenueSummary;
    byPaymentMethod: PaymentMethodSummary[];
    byProfessional: ProfessionalSummary[];
};

@Injectable()
export class FinancialReportService {
    constructor(private readonly prismaProvider: PrismaProvider) {}

    private get prisma() {
        return this.prismaProvider.client;
    }

    async getRevenueReport(
        clinicId: string,
        actorMemberId: string,
        filters: RevenueReportFilters
    ): Promise<RevenueReport> {
        const {page = 1, pageSize = 50} = filters;

        if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1) {
            throw new InvalidInputException('Invalid report pagination');
        }

        const rows = await this.loadRows(clinicId, actorMemberId, filters);
        const skip = (page - 1) * pageSize;

        return {
            ...this.buildSummary(filters, rows),
            payments: rows.slice(skip, skip + pageSize),
            pagination: {page, pageSize, total: rows.length},
        };
    }

    async getRevenueSummary(
        clinicId: string,
        actorMemberId: string,
        filters: Omit<RevenueReportFilters, 'page' | 'pageSize'>
    ): Promise<RevenueSummaryReport> {
        return this.buildSummary(filters, await this.loadRows(clinicId, actorMemberId, filters));
    }

    private async loadRows(
        clinicId: string,
        actorMemberId: string,
        filters: RevenueReportFilters
    ): Promise<PaymentListItem[]> {
        const {startDate, endDate, professionalMemberId, paymentMethod, status} = filters;

        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) {
            throw new InvalidInputException('Invalid date range');
        }

        const clinic = await this.prisma.clinic.findUnique({where: {id: clinicId}, select: {id: true}});

        if (clinic === null) {
            throw new ResourceNotFoundException('clinic.not_found', clinicId);
        }

        const actor = await this.prisma.clinicMember.findUnique({where: {id: actorMemberId}, select: {clinicId: true}});

        if (actor?.clinicId !== clinicId) {
            throw new AccessDeniedException('Member does not belong to this clinic.', AccessDeniedReason.NOT_ALLOWED);
        }

        const appointments = await this.prisma.appointment.findMany({
            where: {
                clinicId,
                startAt: {gte: startDate, lte: endDate},
                attendedByMemberId: professionalMemberId,
                OR: [
                    {payment: {is: {clinicId, deletedAt: null, paymentMethod}}},
                    ...(paymentMethod === undefined
                        ? [
                              {
                                  procedurePriceInCents: {not: null},
                                  status: {notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW]},
                                  deletedAt: null,
                                  patient: {deletedAt: null},
                              },
                          ]
                        : []),
                ],
            },
            select: {
                id: true,
                status: true,
                startAt: true,
                deletedAt: true,
                procedureName: true,
                procedurePriceInCents: true,
                attendedByMemberId: true,
                attendedBy: {select: {displayName: true, user: {select: {name: true}}}},
                patient: {select: {deletedAt: true, person: {select: {name: true}}}},
                payment: {select: revenuePaymentSelect},
            },
            orderBy: [{startAt: 'desc'}, {id: 'desc'}],
        });

        return appointments.flatMap((appointment) => {
            const candidate = appointment.payment;
            const payment = candidate?.clinicId === clinicId && candidate.deletedAt === null ? candidate : null;
            const active = appointment.deletedAt === null && appointment.patient.deletedAt === null;
            const revenue = projectAppointmentRevenue(
                toEnum(AppointmentStatus, appointment.status),
                active ? appointment.procedurePriceInCents : null,
                payment === null ? null : toRevenuePayment(payment)
            );

            if (
                revenue === null ||
                (paymentMethod !== undefined && revenue.paymentMethod !== paymentMethod) ||
                (status !== undefined && revenue.status !== status)
            ) {
                return [];
            }

            return [
                {
                    ...revenue,
                    paymentId: payment?.id ?? null,
                    appointmentId: appointment.id,
                    patientName: appointment.patient.person.name,
                    professionalName: appointment.attendedBy.displayName ?? appointment.attendedBy.user.name,
                    professionalMemberId: appointment.attendedByMemberId,
                    appointmentDate: appointment.startAt.toISOString(),
                    procedureName: appointment.procedureName,
                    amountBrl: payment?.amountBrl ?? revenue.expectedBrl,
                    insurancePlanName:
                        payment?.insurancePlan?.clinicId === clinicId ? payment.insurancePlan.name : null,
                },
            ];
        });
    }

    private buildSummary(filters: RevenueReportFilters, rows: PaymentListItem[]): RevenueSummaryReport {
        const {startDate, endDate, professionalMemberId, paymentMethod, status} = filters;

        return {
            period: {startDate: startDate.toISOString(), endDate: endDate.toISOString()},
            filters: {professionalMemberId, paymentMethod, status},
            summary: this.computeSummary(rows),
            byPaymentMethod: this.groupByPaymentMethod(rows),
            byProfessional: this.groupByProfessional(rows),
        };
    }

    private computeSummary(rows: PaymentListItem[]): RevenueSummary {
        let expected = brl(0);
        let received = brl(0);
        let pending = brl(0);
        let exempt = brl(0);
        let refunded = brl(0);

        for (const row of rows) {
            expected = expected.plus(row.expectedBrl);
            received = received.plus(row.receivedBrl);
            pending = pending.plus(row.pendingBrl);

            if (row.paymentMethod !== null && !isPrepaidAppointmentMethod(row.paymentMethod)) {
                if (row.status === AppointmentPaymentStatus.EXEMPT) exempt = exempt.plus(brl(row.amountBrl));

                if (row.status === AppointmentPaymentStatus.REFUNDED) refunded = refunded.plus(brl(row.amountBrl));
            }
        }

        return {
            totalBrl: expected.toNumber(),
            totalPaid: received.toNumber(),
            totalPending: pending.toNumber(),
            totalExempt: exempt.toNumber(),
            totalRefunded: refunded.toNumber(),
            appointmentCount: rows.length,
            avgTicketBrl: rows.length > 0 ? expected.div(rows.length).decimalPlaces(2).toNumber() : 0,
        };
    }

    private groupByPaymentMethod(rows: PaymentListItem[]): PaymentMethodSummary[] {
        const byMethod = new Map<PaymentMethod, {count: number; total: ReturnType<typeof brl>}>();

        for (const row of rows) {
            if (row.paymentMethod === null) continue;

            const entry = byMethod.get(row.paymentMethod) ?? {count: 0, total: brl(0)};

            entry.count += 1;
            entry.total = entry.total.plus(row.expectedBrl);
            byMethod.set(row.paymentMethod, entry);
        }

        return [...byMethod].map(([method, {count, total}]) => ({method, count, totalBrl: total.toNumber()}));
    }

    private groupByProfessional(rows: PaymentListItem[]): ProfessionalSummary[] {
        const byProfessional = new Map<string, {displayName: string; count: number; total: ReturnType<typeof brl>}>();

        for (const row of rows) {
            const memberId = row.professionalMemberId;
            const entry = byProfessional.get(memberId) ?? {displayName: row.professionalName, count: 0, total: brl(0)};

            entry.count += 1;
            entry.total = entry.total.plus(row.expectedBrl);
            byProfessional.set(memberId, entry);
        }

        return [...byProfessional].map(([memberId, {displayName, count, total}]) => ({
            memberId,
            displayName,
            count,
            totalBrl: total.toNumber(),
        }));
    }
}
