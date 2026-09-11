import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {entityId} from '@application/@shared/validation/schemas';
import {PatientSubscriptionPlanId} from '@domain/patient-subscription-plan/entities';
import {PatientId} from '@domain/patient/entities';

export const subscribePatientInputSchema = z.object({
    subscriptionPlanId: entityId(PatientSubscriptionPlanId),
});

export class SubscribePatientInputDto extends createZodDto(subscribePatientInputSchema) {}

export const subscribePatientSchema = subscribePatientInputSchema.extend({
    patientId: entityId(PatientId),
});

export type SubscribePatientDto = z.infer<typeof subscribePatientSchema>;
