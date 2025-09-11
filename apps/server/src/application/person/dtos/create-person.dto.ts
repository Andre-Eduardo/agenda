import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import {Gender, PersonType} from '../../../domain/person/entities';
import {documentId, entityId, phone} from '../../@shared/validation/schemas';

export const createPersonSchema = z.object({
    companyId: entityId(CompanyId),
    name: z.string().min(1).openapi({example: 'John doe'}),
    companyName: z.string().min(1).nullish().openapi({example: 'ACME'}),
    documentId,
    phone: phone().nullish(),
    personType: z.nativeEnum(PersonType).openapi({example: PersonType.LEGAL, enumName: 'PersonType'}),
    gender: z.nativeEnum(Gender).nullish().openapi({example: Gender.MALE, enumName: 'Gender'}),
});
