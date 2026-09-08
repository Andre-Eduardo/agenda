import {z} from 'zod';
import {entityId} from '@application/@shared/validation/schemas';
import {PatientPackageId} from '@domain/patient-package/entities';
import {PatientId} from '@domain/patient/entities';

export const patientPackagePatientParamSchema = z.object({
    patientId: entityId(PatientId),
});

export type ListPatientPackagesDto = z.infer<typeof patientPackagePatientParamSchema>;

export const patientPackageCreditHistoryParamSchema = z.object({
    patientId: entityId(PatientId),
    id: entityId(PatientPackageId),
});

export type GetPatientPackageCreditHistoryDto = z.infer<typeof patientPackageCreditHistoryParamSchema>;
