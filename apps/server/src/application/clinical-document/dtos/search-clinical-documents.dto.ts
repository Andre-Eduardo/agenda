import {z} from 'zod';
import {PatientId} from '../../../domain/patient/entities';
import {ClinicalDocumentStatus, ClinicalDocumentType} from '../../../domain/clinical-document/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const searchClinicalDocumentsSchema = z.object({
    patientId: entityId(PatientId).optional(),
    type: z.nativeEnum(ClinicalDocumentType).optional(),
    status: z.nativeEnum(ClinicalDocumentStatus).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

export class SearchClinicalDocumentsDto extends createZodDto(searchClinicalDocumentsSchema) {}
