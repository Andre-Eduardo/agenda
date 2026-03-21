import {z} from 'zod';
import {AppointmentId} from '../../../domain/appointment/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {datetime, entityId} from '../../@shared/validation/schemas';

const updateAppointmentInputSchema = z.object({
    date: datetime.optional(),
    note: z.string().nullish().openapi({example: 'Rescheduled appointment'}),
    canceledAt: datetime.nullish(),
    canceledReason: z.string().nullish().openapi({example: 'Patient requested cancellation'}),
});

export class UpdateAppointmentInputDto extends createZodDto(updateAppointmentInputSchema) {}

export const updateAppointmentSchema = updateAppointmentInputSchema.extend({
    id: entityId(AppointmentId),
});

export type UpdateAppointmentDto = z.infer<typeof updateAppointmentSchema>;
