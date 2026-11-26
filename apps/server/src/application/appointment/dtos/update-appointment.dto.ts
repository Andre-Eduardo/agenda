import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {datetime, entityId} from '@application/@shared/validation/schemas';
import {procedureIdSchema, procedureOverridesSchema} from '@application/procedure/dtos';
import {AppointmentId, AppointmentType} from '@domain/appointment/entities';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {RoomId} from '@domain/room/entities';

const updateAppointmentInputSchema = z
    .object({
        startAt: datetime.optional(),
        endAt: datetime.optional(),
        procedureId: procedureIdSchema.optional(),
        procedureOverrides: procedureOverridesSchema.partial().optional(),
        type: z.nativeEnum(AppointmentType).optional(),
        note: z.string().nullish().openapi({example: 'Rescheduled appointment'}),
        attendedByMemberId: entityId(ClinicMemberId).optional(),
        roomId: entityId(RoomId).nullish(),
        /** See CreateAppointmentDto.confirmOutsideAvailability. */
        confirmOutsideAvailability: z.boolean().optional().default(false),
    })
    // Nest Swagger expects an explicit required list when every Zod property is optional.
    .openapi({required: []});

export class UpdateAppointmentInputDto extends createZodDto(updateAppointmentInputSchema) {}

export const updateAppointmentSchema = updateAppointmentInputSchema.extend({
    id: entityId(AppointmentId),
});

export type UpdateAppointmentDto = z.infer<typeof updateAppointmentSchema>;
