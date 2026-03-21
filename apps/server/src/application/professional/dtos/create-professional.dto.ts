import {z} from 'zod';
import {Gender, PersonType} from '../../../domain/person/entities';
import {UserId} from '../../../domain/user/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {documentId, entityId, phone} from '../../@shared/validation/schemas';

export const createProfessionalSchema = z.object({
    name: z.string().min(1).openapi({example: 'Dr. Jane Smith'}),
    documentId,
    phone: phone().nullish(),
    gender: z.nativeEnum(Gender).nullish(),
    personType: z.nativeEnum(PersonType).optional(),
    specialty: z.string().min(1).openapi({example: 'Cardiology'}),
    userId: entityId(UserId).nullish(),
    color: z.string().nullish().openapi({example: '#3B82F6', description: 'Display color for the professional'}),
});

export class CreateProfessionalDto extends createZodDto(createProfessionalSchema) {}
