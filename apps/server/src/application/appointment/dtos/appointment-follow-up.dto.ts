import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {entityId} from '@application/@shared/validation/schemas';
import {Appointment, AppointmentStatus} from '@domain/appointment/entities';
import {RecordId} from '@domain/record/entities';

export const followUpRecordIdSchema = entityId(RecordId);

@ApiSchema({name: 'AppointmentFollowUp'})
export class AppointmentFollowUpDto {
    @ApiProperty({format: 'uuid'})
    id: string;

    @ApiProperty({format: 'date-time'})
    startAt: string;

    @ApiProperty({enum: AppointmentStatus})
    status: AppointmentStatus;

    constructor(appointment: Appointment) {
        this.id = appointment.id.toString();
        this.startAt = appointment.startAt.toISOString();
        this.status = appointment.status;
    }
}
