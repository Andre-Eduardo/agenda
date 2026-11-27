import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {entityId} from '@application/@shared/validation/schemas';
import {AppointmentDto} from '@application/appointment/dtos/appointment.dto';
import type {Appointment} from '@domain/appointment/entities';
import {AppointmentId} from '@domain/appointment/entities';

export const checkinAppointmentSchema = z.object({
    id: entityId(AppointmentId),
});

export class CheckinAppointmentDto extends createZodDto(checkinAppointmentSchema) {}

@ApiSchema({name: 'CheckinAppointmentResult'})
export class CheckinAppointmentResultDto extends AppointmentDto {
    @ApiProperty({type: Boolean})
    inPatientCallQueue: boolean;

    constructor(appointment: Appointment, inPatientCallQueue: boolean) {
        super(appointment);
        this.inPatientCallQueue = inPatientCallQueue;
    }
}
