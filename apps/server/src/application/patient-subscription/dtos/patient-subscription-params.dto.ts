import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {entityId} from '@application/@shared/validation/schemas';
import {PatientSubscriptionId} from '@domain/patient-subscription/entities';
import {PatientId} from '@domain/patient/entities';

export const patientSubscriptionPatientParamSchema = z.object({
    patientId: entityId(PatientId),
});

export type ListPatientSubscriptionsDto = z.infer<typeof patientSubscriptionPatientParamSchema>;

export const cancelPatientSubscriptionInputSchema = z.object({
    reason: z.string().min(1).max(500),
});

export class CancelPatientSubscriptionInputDto extends createZodDto(cancelPatientSubscriptionInputSchema) {}

export const cancelPatientSubscriptionSchema = cancelPatientSubscriptionInputSchema.extend({
    id: entityId(PatientSubscriptionId),
});

export type CancelPatientSubscriptionDto = z.infer<typeof cancelPatientSubscriptionSchema>;
