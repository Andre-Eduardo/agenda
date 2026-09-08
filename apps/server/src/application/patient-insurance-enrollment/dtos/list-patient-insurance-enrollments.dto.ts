import {z} from 'zod';
import {entityId} from '@application/@shared/validation/schemas';
import {PatientId} from '@domain/patient/entities';

export const patientInsuranceEnrollmentPatientParamSchema = z.object({
    patientId: entityId(PatientId),
});

export type ListPatientInsuranceEnrollmentsDto = z.infer<typeof patientInsuranceEnrollmentPatientParamSchema>;
