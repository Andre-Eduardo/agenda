import {z} from 'zod';
import {entityId} from '@application/@shared/validation/schemas';
import {PatientId} from '@domain/patient/entities';

export const getClinicalProfileSchema = z.object({
    patientId: entityId(PatientId),
});

export type GetClinicalProfileDto = z.infer<typeof getClinicalProfileSchema>;
