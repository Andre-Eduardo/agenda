import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {datetime, entityId} from '@application/@shared/validation/schemas';
import {AppointmentType} from '@domain/appointment/entities';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {PatientId} from '@domain/patient/entities';
import {RoomId} from '@domain/room/entities';

export const createAppointmentSchema = z.object({
    patientId: entityId(PatientId),
    /** ClinicMember who will attend the appointment (typically a PROFESSIONAL). */
    attendedByMemberId: entityId(ClinicMemberId),
    startAt: datetime,
    endAt: datetime,
    type: z.nativeEnum(AppointmentType),
    note: z.string().nullish().openapi({example: 'Patient has allergy to penicillin'}),
    retroactive: z.boolean().optional(),
    /** Room to use. Falls back to the professional's default room when room management is enabled. */
    roomId: entityId(RoomId).nullish(),
    /**
     * Set to true to confirm scheduling outside the member's working hours or
     * during a member block, after the caller has already warned the user.
     * Without it, such a request fails with a 409 so the UI can show a confirmation.
     */
    confirmOutsideAvailability: z.boolean().optional().default(false),
});

export class CreateAppointmentDto extends createZodDto(createAppointmentSchema) {}
