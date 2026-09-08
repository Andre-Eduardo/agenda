import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {datetime, entityId} from '@application/@shared/validation/schemas';
import {PatientInsuranceEnrollmentId} from '@domain/patient-insurance-enrollment/entities';

export const updatePatientInsuranceEnrollmentInputSchema = z.object({
    cardNumber: z.string().nullish(),
    validFrom: datetime.nullish(),
    validUntil: datetime.nullish(),
});

export class UpdatePatientInsuranceEnrollmentInputDto extends createZodDto(
    updatePatientInsuranceEnrollmentInputSchema
) {}

export const updatePatientInsuranceEnrollmentSchema = updatePatientInsuranceEnrollmentInputSchema.extend({
    id: entityId(PatientInsuranceEnrollmentId),
});

export type UpdatePatientInsuranceEnrollmentDto = z.infer<typeof updatePatientInsuranceEnrollmentSchema>;

export const setPrimaryPatientInsuranceEnrollmentSchema = z.object({
    id: entityId(PatientInsuranceEnrollmentId),
});

export type SetPrimaryPatientInsuranceEnrollmentDto = z.infer<typeof setPrimaryPatientInsuranceEnrollmentSchema>;
