import {z} from 'zod';
import {Gender, PersonType} from '../../../domain/person/entities';
import {ProfessionalId} from '../../../domain/professional/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {datetime, documentId, entityId, phone} from '../../@shared/validation/schemas';

export const createPatientSchema = z.object({
    name: z.string().min(1).openapi({example: 'John Doe'}),
    documentId,
    phone: phone().nullish(),
    gender: z.nativeEnum(Gender).nullish(),
    personType: z.nativeEnum(PersonType).optional(),
    professionalId: entityId(ProfessionalId).nullish(),
    birthDate: datetime.nullish(),
    email: z.string().email().nullish().openapi({example: 'john.doe@example.com'}),
    emergencyContactName: z.string().nullish().openapi({example: 'Jane Doe'}),
    emergencyContactPhone: z.string().nullish().openapi({example: '(12) 94567-8912'}),
});

export class CreatePatientDto extends createZodDto(createPatientSchema) {}
