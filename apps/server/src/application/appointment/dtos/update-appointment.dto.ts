import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {datetime, entityId} from '@application/@shared/validation/schemas';
import {AppointmentId, AppointmentType} from '@domain/appointment/entities';
import {RoomId} from '@domain/room/entities';

const updateAppointmentInputSchema = z.object({
    startAt: datetime.optional(),
    endAt: datetime.optional(),
    type: z.nativeEnum(AppointmentType).optional(),
    note: z.string().nullish().openapi({example: 'Rescheduled appointment'}),
    roomId: entityId(RoomId).nullish(),
    /** See CreateAppointmentDto.confirmOutsideAvailability. */
    confirmOutsideAvailability: z.boolean().optional().default(false),
});

export class UpdateAppointmentInputDto extends createZodDto(updateAppointmentInputSchema) {}

export const updateAppointmentSchema = updateAppointmentInputSchema.extend({
    id: entityId(AppointmentId),
});

export type UpdateAppointmentDto = z.infer<typeof updateAppointmentSchema>;
