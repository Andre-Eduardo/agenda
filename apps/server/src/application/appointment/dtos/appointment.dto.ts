import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {EntityDto} from '@application/@shared/dto';
import {AppointmentRevenueDto} from '@application/appointment-payment/dtos';
import type {AppointmentRevenue} from '@domain/appointment-payment/appointment-revenue';
import {AppointmentPaymentStatus} from '@domain/appointment-payment/entities';
import type {Appointment} from '@domain/appointment/entities';
import {AppointmentStatus, AppointmentType} from '@domain/appointment/entities';
import {ProcedureColor, ProcedureModality, ScheduledProcedure} from '@domain/procedure/procedure.entity';

@ApiSchema({name: 'ScheduledProcedure'})
export class ScheduledProcedureDto implements ScheduledProcedure {
    @ApiProperty({format: 'uuid'})
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty({enum: ProcedureColor, enumName: 'ProcedureColor'})
    color: ProcedureColor;

    @ApiProperty({description: 'Price in BRL cents'})
    priceInCents: number;

    @ApiProperty({enum: ProcedureModality, enumName: 'ProcedureModality'})
    modality: ProcedureModality;

    constructor(procedure: ScheduledProcedure) {
        this.id = procedure.id;
        this.name = procedure.name;
        this.color = procedure.color;
        this.priceInCents = procedure.priceInCents;
        this.modality = procedure.modality;
    }
}

@ApiSchema({name: 'Appointment'})
export class AppointmentDto extends EntityDto {
    @ApiProperty({format: 'uuid', description: 'The clinic this appointment belongs to'})
    clinicId: string;

    @ApiProperty({format: 'uuid', description: 'The patient ID'})
    patientId: string;

    @ApiProperty({format: 'uuid', description: 'ClinicMember scheduled to attend'})
    attendedByMemberId: string;

    @ApiProperty({
        format: 'uuid',
        description: 'ClinicMember who created/scheduled the appointment',
    })
    createdByMemberId: string;

    @ApiProperty({format: 'date-time', description: 'The appointment start time'})
    startAt: string;

    @ApiProperty({format: 'date-time', description: 'The appointment end time'})
    endAt: string;

    @ApiProperty({description: 'Duration in minutes'})
    durationMinutes: number;

    @ApiProperty({type: ScheduledProcedureDto, nullable: true})
    procedure: ScheduledProcedureDto | null;

    @ApiProperty({enum: AppointmentType, description: 'The appointment type'})
    type: AppointmentType;

    @ApiProperty({enum: AppointmentStatus, description: 'The appointment status'})
    status: AppointmentStatus;

    @ApiProperty({
        type: 'string',
        format: 'date-time',
        nullable: true,
        description: 'When the appointment was canceled',
    })
    canceledAt: string | null;

    @ApiProperty({nullable: true, description: 'The reason for cancellation'})
    canceledReason: string | null;

    @ApiProperty({nullable: true, description: 'Notes about the appointment'})
    note: string | null;

    @ApiProperty({
        type: 'string',
        format: 'date-time',
        nullable: true,
        description: 'When the patient arrived at the reception',
    })
    arrivedAt: string | null;

    @ApiProperty({
        type: 'string',
        format: 'date-time',
        nullable: true,
        description: 'When the patient was called to the room',
    })
    calledAt: string | null;

    @ApiProperty({
        enum: AppointmentPaymentStatus,
        enumName: 'AppointmentPaymentStatus',
        nullable: true,
        description: 'Financial status of the appointment payment, null if no payment registered',
    })
    paymentStatus: AppointmentPaymentStatus | null;

    @ApiProperty({type: AppointmentRevenueDto, nullable: true})
    revenue: AppointmentRevenueDto | null;

    @ApiProperty({
        type: String,
        format: 'uuid',
        nullable: true,
        description: 'Room where the appointment takes place, when room management is enabled',
    })
    roomId: string | null;

    constructor(appointment: Appointment, revenue: AppointmentRevenue | null = null) {
        super(appointment);
        this.clinicId = appointment.clinicId.toString();
        this.patientId = appointment.patientId.toString();
        this.attendedByMemberId = appointment.attendedByMemberId.toString();
        this.createdByMemberId = appointment.createdByMemberId.toString();
        this.startAt = appointment.startAt.toISOString();
        this.endAt = appointment.endAt.toISOString();
        this.durationMinutes = appointment.durationMinutes;
        this.procedure = appointment.procedure === null ? null : new ScheduledProcedureDto(appointment.procedure);
        this.type = appointment.type;
        this.status = appointment.status;
        this.canceledAt = appointment.canceledAt?.toISOString() ?? null;
        this.canceledReason = appointment.canceledReason;
        this.note = appointment.note;
        this.arrivedAt = appointment.arrivedAt?.toISOString() ?? null;
        this.calledAt = appointment.calledAt?.toISOString() ?? null;
        this.paymentStatus = revenue?.status ?? null;
        this.revenue = revenue === null ? null : new AppointmentRevenueDto(revenue);
        this.roomId = appointment.roomId?.toString() ?? null;
    }
}

@ApiSchema({name: 'AppointmentListItem'})
export class AppointmentListItemDto extends AppointmentDto {
    @ApiProperty({type: String, nullable: true, description: 'Display name of the scheduled clinic member'})
    attendedByName: string | null;

    constructor(appointment: Appointment, revenue: AppointmentRevenue | null, attendedByName: string | null) {
        super(appointment, revenue);
        this.attendedByName = attendedByName;
    }
}

@ApiSchema({name: 'PaginatedAppointments'})
export class PaginatedAppointmentsDto {
    @ApiProperty({type: () => [AppointmentListItemDto]})
    data!: AppointmentListItemDto[];

    @ApiProperty()
    totalCount!: number;
}
