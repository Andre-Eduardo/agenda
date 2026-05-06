import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {entityId} from '@application/@shared/validation/schemas';
import {PatientId} from '@domain/patient/entities';

export const getPatientSchema = z.object({
    id: entityId(PatientId),
});

export class GetPatientDto extends createZodDto(getPatientSchema) {}
