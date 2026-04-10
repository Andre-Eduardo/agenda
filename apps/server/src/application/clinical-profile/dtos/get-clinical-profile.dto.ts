import {z} from 'zod';
import {PatientId} from '../../../domain/patient/entities';
import {entityId} from '../../@shared/validation/schemas';

export const getClinicalProfileSchema = z.object({
    patientId: entityId(PatientId),
});

export type GetClinicalProfileDto = z.infer<typeof getClinicalProfileSchema>;
