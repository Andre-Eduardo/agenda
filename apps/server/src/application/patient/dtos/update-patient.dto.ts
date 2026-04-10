import {z} from 'zod';
import {Gender} from '../../../domain/person/entities';
import {PatientId} from '../../../domain/patient/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {datetime, entityId, phone} from '../../@shared/validation/schemas';

const updatePatientInputSchema = z.object({
    name: z.string().min(1).optional().openapi({example: 'John Doe'}),
    phone: phone().nullish(),
    gender: z.nativeEnum(Gender).nullish(),
    birthDate: datetime.nullish(),
    email: z.string().email().nullish().openapi({example: 'john.doe@example.com'}),
    emergencyContactName: z.string().nullish().openapi({example: 'Jane Doe'}),
    emergencyContactPhone: z.string().nullish().openapi({example: '(12) 94567-8912'}),
});

export class UpdatePatientInputDto extends createZodDto(updatePatientInputSchema) {}

export const updatePatientSchema = updatePatientInputSchema.extend({
    id: entityId(PatientId),
});

export type UpdatePatientDto = z.infer<typeof updatePatientSchema>;
