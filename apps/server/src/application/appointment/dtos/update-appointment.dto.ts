import {z} from 'zod';
import {AppointmentId, AppointmentType} from '../../../domain/appointment/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {datetime, entityId} from '../../@shared/validation/schemas';

const updateAppointmentInputSchema = z.object({
    startAt: datetime.optional(),
    endAt: datetime.optional(),
    type: z.nativeEnum(AppointmentType).optional(),
    note: z.string().nullish().openapi({example: 'Rescheduled appointment'}),
});

export class UpdateAppointmentInputDto extends createZodDto(updateAppointmentInputSchema) {}

export const updateAppointmentSchema = updateAppointmentInputSchema.extend({
    id: entityId(AppointmentId),
});

export type UpdateAppointmentDto = z.infer<typeof updateAppointmentSchema>;
