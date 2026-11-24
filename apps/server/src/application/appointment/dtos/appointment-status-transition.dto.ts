import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {AppointmentStatusTransition} from '@domain/appointment/appointment.repository';
import {AppointmentStatus} from '@domain/appointment/entities';

@ApiSchema({name: 'AppointmentStatusTransition'})
export class AppointmentStatusTransitionDto {
    @ApiProperty({format: 'uuid'}) id: string;
    @ApiProperty({format: 'uuid'}) appointmentId: string;
    @ApiProperty({format: 'uuid'}) actorUserId: string;
    @ApiProperty({format: 'uuid'}) actorMemberId: string;
    @ApiProperty({enum: AppointmentStatus}) fromStatus: AppointmentStatus;
    @ApiProperty({enum: AppointmentStatus}) toStatus: AppointmentStatus;
    @ApiProperty({type: String, nullable: true}) reason: string | null;
    @ApiProperty({format: 'date-time'}) occurredAt: string;

    constructor(transition: AppointmentStatusTransition) {
        this.id = transition.id;
        this.appointmentId = transition.appointmentId.toString();
        this.actorUserId = transition.actorUserId.toString();
        this.actorMemberId = transition.actorMemberId.toString();
        this.fromStatus = transition.fromStatus;
        this.toStatus = transition.toStatus;
        this.reason = transition.reason;
        this.occurredAt = transition.occurredAt.toISOString();
    }
}
