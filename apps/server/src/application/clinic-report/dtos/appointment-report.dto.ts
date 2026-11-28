import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import type {
    AppointmentReport,
    AppointmentReportByDay,
    AppointmentReportByProfessional,
    AppointmentReportSummary,
} from '@application/clinic-report/services/appointment-report.builder';
import {AppointmentStatus, AppointmentType} from '@domain/appointment/entities';

export const getAppointmentReportSchema = z.object({
    startDate: z.coerce.date().openapi({description: 'Start of the period (inclusive), ISO 8601'}),
    endDate: z.coerce.date().openapi({description: 'End of the period (inclusive), ISO 8601'}),
    professionalMemberId: z
        .string()
        .uuid()
        .optional()
        .openapi({description: 'Only appointments attended by this clinic member'}),
    timeZone: z
        .string()
        .max(64)
        .optional()
        .openapi({description: 'IANA time zone used to group by day, weekday and hour (default UTC)'}),
});

export class GetAppointmentReportDto extends createZodDto(getAppointmentReportSchema) {}

class AppointmentReportPeriodDto {
    @ApiProperty({format: 'date-time'}) startDate: string;
    @ApiProperty({format: 'date-time'}) endDate: string;
    @ApiProperty() timeZone: string;

    constructor(period: AppointmentReport['period']) {
        this.startDate = period.startDate;
        this.endDate = period.endDate;
        this.timeZone = period.timeZone;
    }
}

class AppointmentReportFiltersDto {
    @ApiProperty({type: String, format: 'uuid', required: false})
    professionalMemberId?: string;

    constructor(filters: AppointmentReport['filters']) {
        this.professionalMemberId = filters.professionalMemberId;
    }
}

@ApiSchema({name: 'AppointmentReportSummary'})
class AppointmentReportSummaryDto {
    @ApiProperty() total: number;
    @ApiProperty() completed: number;
    @ApiProperty() cancelled: number;
    @ApiProperty() noShow: number;
    @ApiProperty({description: 'Scheduled, confirmed, arrived or in progress'}) pending: number;
    @ApiProperty({type: Number, nullable: true, description: 'completed / (completed + no-show)'})
    attendanceRate: number | null;
    @ApiProperty({type: Number, nullable: true, description: 'no-show / (completed + no-show)'})
    noShowRate: number | null;
    @ApiProperty({type: Number, nullable: true, description: 'cancelled / total'})
    cancellationRate: number | null;
    @ApiProperty() uniquePatients: number;
    @ApiProperty({description: 'Patients whose first appointment in the clinic falls in the period'})
    newPatients: number;
    @ApiProperty({type: Number, nullable: true, description: 'Average minutes between check-in and call'})
    avgWaitMinutes: number | null;
    @ApiProperty({description: 'Booked minutes, cancelled appointments excluded'}) bookedMinutes: number;

    constructor(summary: AppointmentReportSummary) {
        this.total = summary.total;
        this.completed = summary.completed;
        this.cancelled = summary.cancelled;
        this.noShow = summary.noShow;
        this.pending = summary.pending;
        this.attendanceRate = summary.attendanceRate;
        this.noShowRate = summary.noShowRate;
        this.cancellationRate = summary.cancellationRate;
        this.uniquePatients = summary.uniquePatients;
        this.newPatients = summary.newPatients;
        this.avgWaitMinutes = summary.avgWaitMinutes;
        this.bookedMinutes = summary.bookedMinutes;
    }
}

class AppointmentReportStatusCountDto {
    @ApiProperty({enum: AppointmentStatus}) status: AppointmentStatus;
    @ApiProperty() count: number;

    constructor(entry: AppointmentReport['byStatus'][number]) {
        this.status = entry.status;
        this.count = entry.count;
    }
}

class AppointmentReportTypeCountDto {
    @ApiProperty({enum: AppointmentType}) type: AppointmentType;
    @ApiProperty() count: number;

    constructor(entry: AppointmentReport['byType'][number]) {
        this.type = entry.type;
        this.count = entry.count;
    }
}

@ApiSchema({name: 'AppointmentReportByProfessional'})
class AppointmentReportByProfessionalDto {
    @ApiProperty({format: 'uuid'}) memberId: string;
    @ApiProperty() displayName: string;
    @ApiProperty() total: number;
    @ApiProperty() completed: number;
    @ApiProperty() cancelled: number;
    @ApiProperty() noShow: number;
    @ApiProperty() pending: number;
    @ApiProperty({type: Number, nullable: true}) attendanceRate: number | null;
    @ApiProperty() uniquePatients: number;

    constructor(entry: AppointmentReportByProfessional) {
        this.memberId = entry.memberId;
        this.displayName = entry.displayName;
        this.total = entry.total;
        this.completed = entry.completed;
        this.cancelled = entry.cancelled;
        this.noShow = entry.noShow;
        this.pending = entry.pending;
        this.attendanceRate = entry.attendanceRate;
        this.uniquePatients = entry.uniquePatients;
    }
}

class AppointmentReportProcedureCountDto {
    @ApiProperty({type: String, nullable: true, description: 'Null for appointments without a procedure'})
    procedureName: string | null;
    @ApiProperty() count: number;
    @ApiProperty() completed: number;

    constructor(entry: AppointmentReport['byProcedure'][number]) {
        this.procedureName = entry.procedureName;
        this.count = entry.count;
        this.completed = entry.completed;
    }
}

@ApiSchema({name: 'AppointmentReportByDay'})
class AppointmentReportByDayDto {
    @ApiProperty({description: 'Day in the report time zone (YYYY-MM-DD)'}) date: string;
    @ApiProperty() total: number;
    @ApiProperty() completed: number;
    @ApiProperty() cancelled: number;
    @ApiProperty() noShow: number;
    @ApiProperty() pending: number;

    constructor(entry: AppointmentReportByDay) {
        this.date = entry.date;
        this.total = entry.total;
        this.completed = entry.completed;
        this.cancelled = entry.cancelled;
        this.noShow = entry.noShow;
        this.pending = entry.pending;
    }
}

class AppointmentReportWeekdayCountDto {
    @ApiProperty({description: '0 = Sunday … 6 = Saturday'}) weekday: number;
    @ApiProperty() count: number;

    constructor(entry: AppointmentReport['byWeekday'][number]) {
        this.weekday = entry.weekday;
        this.count = entry.count;
    }
}

class AppointmentReportHourCountDto {
    @ApiProperty({description: '0 … 23'}) hour: number;
    @ApiProperty() count: number;

    constructor(entry: AppointmentReport['byHour'][number]) {
        this.hour = entry.hour;
        this.count = entry.count;
    }
}

@ApiSchema({name: 'AppointmentReport'})
export class AppointmentReportDto {
    @ApiProperty({type: AppointmentReportPeriodDto}) period: AppointmentReportPeriodDto;
    @ApiProperty({type: AppointmentReportFiltersDto}) filters: AppointmentReportFiltersDto;
    @ApiProperty({type: AppointmentReportSummaryDto}) summary: AppointmentReportSummaryDto;
    @ApiProperty({type: [AppointmentReportStatusCountDto]}) byStatus: AppointmentReportStatusCountDto[];
    @ApiProperty({type: [AppointmentReportTypeCountDto]}) byType: AppointmentReportTypeCountDto[];
    @ApiProperty({type: [AppointmentReportByProfessionalDto]})
    byProfessional: AppointmentReportByProfessionalDto[];
    @ApiProperty({type: [AppointmentReportProcedureCountDto]}) byProcedure: AppointmentReportProcedureCountDto[];
    @ApiProperty({type: [AppointmentReportByDayDto]}) byDay: AppointmentReportByDayDto[];
    @ApiProperty({type: [AppointmentReportWeekdayCountDto]}) byWeekday: AppointmentReportWeekdayCountDto[];
    @ApiProperty({type: [AppointmentReportHourCountDto]}) byHour: AppointmentReportHourCountDto[];

    constructor(report: AppointmentReport) {
        this.period = new AppointmentReportPeriodDto(report.period);
        this.filters = new AppointmentReportFiltersDto(report.filters);
        this.summary = new AppointmentReportSummaryDto(report.summary);
        this.byStatus = report.byStatus.map((entry) => new AppointmentReportStatusCountDto(entry));
        this.byType = report.byType.map((entry) => new AppointmentReportTypeCountDto(entry));
        this.byProfessional = report.byProfessional.map((entry) => new AppointmentReportByProfessionalDto(entry));
        this.byProcedure = report.byProcedure.map((entry) => new AppointmentReportProcedureCountDto(entry));
        this.byDay = report.byDay.map((entry) => new AppointmentReportByDayDto(entry));
        this.byWeekday = report.byWeekday.map((entry) => new AppointmentReportWeekdayCountDto(entry));
        this.byHour = report.byHour.map((entry) => new AppointmentReportHourCountDto(entry));
    }
}
