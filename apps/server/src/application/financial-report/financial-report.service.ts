import {Injectable} from '@nestjs/common';
import {InvalidInputException, PreconditionException, ResourceNotFoundException} from '../../domain/@shared/exceptions';
import {AppointmentPaymentStatus, PaymentMethod} from '../../domain/appointment-payment/entities';
import {PrismaProvider} from '../../infrastructure/repository/prisma/prisma.provider';

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

export type PaymentListItem = {
    paymentId: string;
    appointmentId: string;
    patientName: string;
    professionalName: string;
    appointmentDate: string;
    paymentMethod: PaymentMethod;
    status: AppointmentPaymentStatus;
    amountBrl: number;
    paidAt: string | null;
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

    private validateDateRange(startDate: Date, endDate: Date): void {
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new InvalidInputException('Invalid date range');
        }
        if (startDate > endDate) {
            throw new InvalidInputException('startDate must be before or equal to endDate');
        }
    }

    async getRevenueReport(clinicId: string, actorMemberId: string, filters: RevenueReportFilters): Promise<RevenueReport> {
        const {startDate, endDate, professionalMemberId, paymentMethod, status, page = 1, pageSize = 50} = filters;

        this.validateDateRange(startDate, endDate);

        const clinic = await this.prisma.clinic.findUnique({where: {id: clinicId}});
        if (!clinic) {
            throw new ResourceNotFoundException('clinic.not_found', clinicId);
        }

        const actor = await this.prisma.clinicMember.findUnique({where: {id: actorMemberId}});
        if (!actor || actor.clinicId !== clinicId) {
            throw new PreconditionException('Member does not belong to this clinic.');
        }

        const where = {
            clinicId,
            createdAt: {gte: startDate, lte: endDate},
            ...(paymentMethod ? {paymentMethod} : {}),
            ...(status ? {status} : {}),
            ...(professionalMemberId
                ? {appointment: {attendedByMemberId: professionalMemberId}}
                : {}),
        };

        const allPayments = await this.prisma.appointmentPayment.findMany({
            where,
            include: {
                appointment: {
                    include: {
                        attendedBy: {include: {user: true}},
                        patient: {include: {person: true}},
                    },
                },
                insurancePlan: {select: {name: true}},
            },
            orderBy: {createdAt: 'desc'},
        });

        const summary = this.computeSummary(allPayments);
        const byPaymentMethod = this.groupByPaymentMethod(allPayments);
        const byProfessional = this.groupByProfessional(allPayments);

        const total = allPayments.length;
        const skip = (page - 1) * pageSize;
        const paginated = allPayments.slice(skip, skip + pageSize);

        const payments: PaymentListItem[] = paginated.map((p) => ({
            paymentId: p.id,
            appointmentId: p.appointmentId,
            patientName: p.appointment.patient.person.name,
            professionalName: p.appointment.attendedBy.displayName ?? p.appointment.attendedBy.user.name,
            appointmentDate: p.appointment.startAt.toISOString(),
            paymentMethod: p.paymentMethod as PaymentMethod,
            status: p.status as AppointmentPaymentStatus,
            amountBrl: p.amountBrl,
            paidAt: p.paidAt?.toISOString() ?? null,
            insurancePlanName: p.insurancePlan?.name ?? null,
        }));

        return {
            period: {startDate: startDate.toISOString(), endDate: endDate.toISOString()},
            filters: {professionalMemberId, paymentMethod, status},
            summary,
            byPaymentMethod,
            byProfessional,
            payments,
            pagination: {page, pageSize, total},
        };
    }

    async getRevenueSummary(clinicId: string, actorMemberId: string, filters: Omit<RevenueReportFilters, 'page' | 'pageSize'>): Promise<RevenueSummaryReport> {
        const {startDate, endDate, professionalMemberId, paymentMethod, status} = filters;

        this.validateDateRange(startDate, endDate);

        const clinic = await this.prisma.clinic.findUnique({where: {id: clinicId}});
        if (!clinic) {
            throw new ResourceNotFoundException('clinic.not_found', clinicId);
        }

        const actor = await this.prisma.clinicMember.findUnique({where: {id: actorMemberId}});
        if (!actor || actor.clinicId !== clinicId) {
            throw new PreconditionException('Member does not belong to this clinic.');
        }

        const where = {
            clinicId,
            createdAt: {gte: startDate, lte: endDate},
            ...(paymentMethod ? {paymentMethod} : {}),
            ...(status ? {status} : {}),
            ...(professionalMemberId
                ? {appointment: {attendedByMemberId: professionalMemberId}}
                : {}),
        };

        const allPayments = await this.prisma.appointmentPayment.findMany({
            where,
            include: {
                appointment: {
                    include: {
                        attendedBy: {include: {user: true}},
                    },
                },
            },
        });

        return {
            period: {startDate: startDate.toISOString(), endDate: endDate.toISOString()},
            filters: {professionalMemberId, paymentMethod, status},
            summary: this.computeSummary(allPayments),
            byPaymentMethod: this.groupByPaymentMethod(allPayments),
            byProfessional: this.groupByProfessional(allPayments),
        };
    }

    private computeSummary(payments: {amountBrl: number; status: string}[]): RevenueSummary {
        let totalBrl = 0;
        let totalPaid = 0;
        let totalPending = 0;
        let totalExempt = 0;
        let totalRefunded = 0;

        for (const p of payments) {
            totalBrl += p.amountBrl;
            if (p.status === AppointmentPaymentStatus.PAID) totalPaid += p.amountBrl;
            else if (p.status === AppointmentPaymentStatus.PENDING) totalPending += p.amountBrl;
            else if (p.status === AppointmentPaymentStatus.EXEMPT) totalExempt += p.amountBrl;
            else if (p.status === AppointmentPaymentStatus.REFUNDED) totalRefunded += p.amountBrl;
        }

        const appointmentCount = payments.length;
        const avgTicketBrl = appointmentCount > 0 ? Number((totalBrl / appointmentCount).toFixed(2)) : 0;

        return {
            totalBrl: Number(totalBrl.toFixed(2)),
            totalPaid: Number(totalPaid.toFixed(2)),
            totalPending: Number(totalPending.toFixed(2)),
            totalExempt: Number(totalExempt.toFixed(2)),
            totalRefunded: Number(totalRefunded.toFixed(2)),
            appointmentCount,
            avgTicketBrl,
        };
    }

    private groupByPaymentMethod(payments: {amountBrl: number; paymentMethod: string}[]): PaymentMethodSummary[] {
        const byMethod = new Map<string, {count: number; totalBrl: number}>();

        for (const p of payments) {
            const entry = byMethod.get(p.paymentMethod) ?? {count: 0, totalBrl: 0};
            entry.count += 1;
            entry.totalBrl += p.amountBrl;
            byMethod.set(p.paymentMethod, entry);
        }

        return Array.from(byMethod.entries()).map(([method, data]) => ({
            method: method as PaymentMethod,
            count: data.count,
            totalBrl: Number(data.totalBrl.toFixed(2)),
        }));
    }

    private groupByProfessional(
        payments: {amountBrl: number; appointment: {attendedByMemberId: string; attendedBy: {displayName: string | null; user: {name: string}}}}[],
    ): ProfessionalSummary[] {
        const byProfessional = new Map<string, {displayName: string; count: number; totalBrl: number}>();

        for (const p of payments) {
            const memberId = p.appointment.attendedByMemberId;
            const displayName = p.appointment.attendedBy.displayName ?? p.appointment.attendedBy.user.name;
            const entry = byProfessional.get(memberId) ?? {displayName, count: 0, totalBrl: 0};
            entry.count += 1;
            entry.totalBrl += p.amountBrl;
            byProfessional.set(memberId, entry);
        }

        return Array.from(byProfessional.entries()).map(([memberId, data]) => ({
            memberId,
            displayName: data.displayName,
            count: data.count,
            totalBrl: Number(data.totalBrl.toFixed(2)),
        }));
    }
}
