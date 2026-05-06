import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {entityId} from '@application/@shared/validation/schemas';
import {AppointmentId} from '@domain/appointment/entities';

export const checkinAppointmentSchema = z.object({
    id: entityId(AppointmentId),
});

export class CheckinAppointmentDto extends createZodDto(checkinAppointmentSchema) {}
