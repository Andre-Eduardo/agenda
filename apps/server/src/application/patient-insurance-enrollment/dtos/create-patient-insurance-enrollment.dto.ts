import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {datetime, entityId} from '@application/@shared/validation/schemas';
import {InsurancePlanId} from '@domain/insurance-plan/entities';
import {PatientId} from '@domain/patient/entities';

export const createPatientInsuranceEnrollmentInputSchema = z.object({
    insurancePlanId: entityId(InsurancePlanId),
    cardNumber: z.string().nullish().openapi({example: '000123456789'}),
    validFrom: datetime.nullish(),
    validUntil: datetime.nullish(),
    /** First enrollment for a patient is always primary regardless of this flag. */
    isPrimary: z.boolean().optional().default(false),
});

export class CreatePatientInsuranceEnrollmentInputDto extends createZodDto(
    createPatientInsuranceEnrollmentInputSchema
) {}

export const createPatientInsuranceEnrollmentSchema = createPatientInsuranceEnrollmentInputSchema.extend({
    patientId: entityId(PatientId),
});

export type CreatePatientInsuranceEnrollmentDto = z.infer<typeof createPatientInsuranceEnrollmentSchema>;
