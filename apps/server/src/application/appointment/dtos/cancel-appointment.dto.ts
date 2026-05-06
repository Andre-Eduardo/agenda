import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {entityId} from '@application/@shared/validation/schemas';
import {AppointmentId} from '@domain/appointment/entities';

const cancelAppointmentInputSchema = z.object({
    reason: z.string().min(1).openapi({example: 'Patient requested cancellation'}),
});

export class CancelAppointmentInputDto extends createZodDto(cancelAppointmentInputSchema) {}

export const cancelAppointmentSchema = cancelAppointmentInputSchema.extend({
    id: entityId(AppointmentId),
});

export type CancelAppointmentDto = z.infer<typeof cancelAppointmentSchema>;
