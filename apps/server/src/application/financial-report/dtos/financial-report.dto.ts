import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {AppointmentRevenueDto} from '@application/appointment-payment/dtos';
import type {
    PaymentListItem,
    PaymentMethodSummary,
    ProfessionalSummary,
    RevenueReport,
    RevenueSummary,
    RevenueSummaryReport,
} from '@application/financial-report/financial-report.service';
import {AppointmentPaymentStatus, PaymentMethod} from '@domain/appointment-payment/entities';

class RevenueSummaryDto {
    @ApiProperty({description: 'Expected revenue in BRL'}) totalBrl: number;
    @ApiProperty({description: 'Received revenue in BRL'}) totalPaid: number;
    @ApiProperty() totalPending: number;
    @ApiProperty() totalExempt: number;
    @ApiProperty() totalRefunded: number;
    @ApiProperty() appointmentCount: number;
    @ApiProperty() avgTicketBrl: number;

    constructor(s: RevenueSummary) {
        this.totalBrl = s.totalBrl;
        this.totalPaid = s.totalPaid;
        this.totalPending = s.totalPending;
        this.totalExempt = s.totalExempt;
        this.totalRefunded = s.totalRefunded;
        this.appointmentCount = s.appointmentCount;
        this.avgTicketBrl = s.avgTicketBrl;
    }
}

class PaymentMethodSummaryDto {
    @ApiProperty({enum: PaymentMethod}) method: PaymentMethod;
    @ApiProperty() count: number;
    @ApiProperty() totalBrl: number;

    constructor(s: PaymentMethodSummary) {
        this.method = s.method;
        this.count = s.count;
        this.totalBrl = s.totalBrl;
    }
}

class ProfessionalSummaryDto {
    @ApiProperty({format: 'uuid'}) memberId: string;
    @ApiProperty() displayName: string;
    @ApiProperty() count: number;
    @ApiProperty() totalBrl: number;

    constructor(s: ProfessionalSummary) {
        this.memberId = s.memberId;
        this.displayName = s.displayName;
        this.count = s.count;
        this.totalBrl = s.totalBrl;
    }
}

class PaymentListItemDto extends AppointmentRevenueDto {
    @ApiProperty({type: String, format: 'uuid', nullable: true})
    paymentId: string | null;

    @ApiProperty({format: 'uuid'})
    appointmentId: string;

    @ApiProperty()
    patientName: string;

    @ApiProperty()
    professionalName: string;

    @ApiProperty({format: 'date-time'})
    appointmentDate: string;

    @ApiProperty({type: String, nullable: true})
    procedureName: string | null;

    @ApiProperty()
    amountBrl: number;

    @ApiProperty({type: String, nullable: true})
    insurancePlanName: string | null;

    constructor(p: PaymentListItem) {
        super(p);
        this.paymentId = p.paymentId;
        this.appointmentId = p.appointmentId;
        this.patientName = p.patientName;
        this.professionalName = p.professionalName;
        this.appointmentDate = p.appointmentDate;
        this.procedureName = p.procedureName;
        this.amountBrl = p.amountBrl;
        this.insurancePlanName = p.insurancePlanName;
    }
}

class RevenuePaginationDto {
    @ApiProperty() page: number;
    @ApiProperty() pageSize: number;
    @ApiProperty() total: number;

    constructor(pagination: RevenueReport['pagination']) {
        this.page = pagination.page;
        this.pageSize = pagination.pageSize;
        this.total = pagination.total;
    }
}

@ApiSchema({name: 'RevenueReport'})
export class RevenueReportDto {
    @ApiProperty() period: {startDate: string; endDate: string};
    @ApiProperty() filters: {
        professionalMemberId?: string;
        paymentMethod?: PaymentMethod;
        status?: AppointmentPaymentStatus;
    };
    @ApiProperty({type: RevenueSummaryDto}) summary: RevenueSummaryDto;
    @ApiProperty({type: [PaymentMethodSummaryDto]}) byPaymentMethod: PaymentMethodSummaryDto[];
    @ApiProperty({type: [ProfessionalSummaryDto]}) byProfessional: ProfessionalSummaryDto[];
    @ApiProperty({type: [PaymentListItemDto]}) payments: PaymentListItemDto[];
    @ApiProperty({type: RevenuePaginationDto}) pagination: RevenuePaginationDto;

    constructor(report: RevenueReport) {
        this.period = report.period;
        this.filters = report.filters;
        this.summary = new RevenueSummaryDto(report.summary);
        this.byPaymentMethod = report.byPaymentMethod.map((s) => new PaymentMethodSummaryDto(s));
        this.byProfessional = report.byProfessional.map((s) => new ProfessionalSummaryDto(s));
        this.payments = report.payments.map((p) => new PaymentListItemDto(p));
        this.pagination = new RevenuePaginationDto(report.pagination);
    }
}

@ApiSchema({name: 'RevenueSummaryReport'})
export class RevenueSummaryReportDto {
    @ApiProperty() period: {startDate: string; endDate: string};
    @ApiProperty() filters: {
        professionalMemberId?: string;
        paymentMethod?: PaymentMethod;
        status?: AppointmentPaymentStatus;
    };
    @ApiProperty({type: RevenueSummaryDto}) summary: RevenueSummaryDto;
    @ApiProperty({type: [PaymentMethodSummaryDto]}) byPaymentMethod: PaymentMethodSummaryDto[];
    @ApiProperty({type: [ProfessionalSummaryDto]}) byProfessional: ProfessionalSummaryDto[];

    constructor(report: RevenueSummaryReport) {
        this.period = report.period;
        this.filters = report.filters;
        this.summary = new RevenueSummaryDto(report.summary);
        this.byPaymentMethod = report.byPaymentMethod.map((s) => new PaymentMethodSummaryDto(s));
        this.byProfessional = report.byProfessional.map((s) => new ProfessionalSummaryDto(s));
    }
}
