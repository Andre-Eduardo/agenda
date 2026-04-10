import {z} from 'zod';
import {PatientId} from '../../../domain/patient/entities';
import {ProfessionalId} from '../../../domain/professional/entities';
import {AppointmentType} from '../../../domain/appointment/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {datetime, entityId} from '../../@shared/validation/schemas';

export const createAppointmentSchema = z.object({
    patientId: entityId(PatientId),
    professionalId: entityId(ProfessionalId),
    startAt: datetime,
    endAt: datetime,
    type: z.nativeEnum(AppointmentType),
    note: z.string().nullish().openapi({example: 'Patient has allergy to penicillin'}),
    retroactive: z.boolean().optional(),
});

export class CreateAppointmentDto extends createZodDto(createAppointmentSchema) {}
