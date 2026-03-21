import {z} from 'zod';
import {Gender, PersonType} from '../../../domain/person/entities';
import {ProfessionalId} from '../../../domain/professional/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {documentId, entityId, phone} from '../../@shared/validation/schemas';

export const createPatientSchema = z.object({
    name: z.string().min(1).openapi({example: 'John Doe'}),
    documentId,
    phone: phone().nullish(),
    gender: z.nativeEnum(Gender).nullish(),
    personType: z.nativeEnum(PersonType).optional(),
    professionalId: entityId(ProfessionalId).nullish(),
});

export class CreatePatientDto extends createZodDto(createPatientSchema) {}
