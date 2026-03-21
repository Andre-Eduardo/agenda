import {z} from 'zod';
import {PatientId} from '../../../domain/patient/entities';
import {ProfessionalId} from '../../../domain/professional/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {datetime, entityId} from '../../@shared/validation/schemas';

export const createAppointmentSchema = z.object({
    patientId: entityId(PatientId),
    professionalId: entityId(ProfessionalId),
    date: datetime,
    note: z.string().nullish().openapi({example: 'Patient has allergy to penicillin'}),
});

export class CreateAppointmentDto extends createZodDto(createAppointmentSchema) {}
