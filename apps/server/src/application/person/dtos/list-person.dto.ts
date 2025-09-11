import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import {Gender, PersonProfile, PersonType} from '../../../domain/person/entities';
import {documentId, entityId, phone} from '../../@shared/validation/schemas';

export const listPersonSchema = z.object({
    companyId: entityId(CompanyId).openapi({description: 'The company ID to search for'}),
    name: z.string().min(1).optional().openapi({description: 'The name to search for'}),
    companyName: z.string().optional().openapi({description: 'The company name to search for'}),
    documentId: documentId.optional().openapi({description: 'The document ID to search for'}),
    phone: phone().optional().openapi({description: 'The phone to search for'}),
    personType: z
        .nativeEnum(PersonType)
        .optional()
        .openapi({description: 'The person type to search for', enumName: 'PersonType'}),
    gender: z.nativeEnum(Gender).optional().openapi({description: 'The gender to search for', enumName: 'Gender'}),
    profiles: z
        .array(z.nativeEnum(PersonProfile))
        .optional()
        .openapi({description: 'The profiles to search for', enumName: 'PersonProfile', isArray: true}),
});
