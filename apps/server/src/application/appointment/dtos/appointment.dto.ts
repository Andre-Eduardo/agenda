import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import type {Appointment} from '../../../domain/appointment/entities';
import {AppointmentStatus, AppointmentType} from '../../../domain/appointment/entities';
import {EntityDto} from '../../@shared/dto';

@ApiSchema({name: 'Appointment'})
export class AppointmentDto extends EntityDto {
    @ApiProperty({format: 'uuid', description: 'The patient ID'})
    patientId: string;

    @ApiProperty({format: 'uuid', description: 'The professional ID'})
    professionalId: string;

    @ApiProperty({format: 'date-time', description: 'The appointment start time'})
    startAt: string;

    @ApiProperty({format: 'date-time', description: 'The appointment end time'})
    endAt: string;

    @ApiProperty({description: 'Duration in minutes'})
    durationMinutes: number;

    @ApiProperty({enum: AppointmentType, description: 'The appointment type'})
    type: AppointmentType;

    @ApiProperty({enum: AppointmentStatus, description: 'The appointment status'})
    status: AppointmentStatus;

    @ApiProperty({format: 'date-time', nullable: true, description: 'When the appointment was canceled'})
    canceledAt: string | null;

    @ApiProperty({nullable: true, description: 'The reason for cancellation'})
    canceledReason: string | null;

    @ApiProperty({nullable: true, description: 'Notes about the appointment'})
    note: string | null;

    constructor(appointment: Appointment) {
        super(appointment);
        this.patientId = appointment.patientId.toString();
        this.professionalId = appointment.professionalId.toString();
        this.startAt = appointment.startAt.toISOString();
        this.endAt = appointment.endAt.toISOString();
        this.durationMinutes = appointment.durationMinutes;
        this.type = appointment.type;
        this.status = appointment.status;
        this.canceledAt = appointment.canceledAt?.toISOString() ?? null;
        this.canceledReason = appointment.canceledReason;
        this.note = appointment.note;
    }
}
