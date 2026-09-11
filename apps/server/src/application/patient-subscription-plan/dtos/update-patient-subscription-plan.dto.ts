import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {entityId} from '@application/@shared/validation/schemas';
import {PatientSubscriptionPlanId} from '@domain/patient-subscription-plan/entities';

export const updatePatientSubscriptionPlanInputSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().nullish(),
    monthlyAppointmentQuota: z.coerce.number().int().positive().optional(),
    priceBrl: z.coerce.number().positive().optional(),
});

export class UpdatePatientSubscriptionPlanInputDto extends createZodDto(updatePatientSubscriptionPlanInputSchema) {}

export const updatePatientSubscriptionPlanSchema = updatePatientSubscriptionPlanInputSchema.extend({
    id: entityId(PatientSubscriptionPlanId),
});

export type UpdatePatientSubscriptionPlanDto = z.infer<typeof updatePatientSubscriptionPlanSchema>;

export const deactivatePatientSubscriptionPlanSchema = z.object({
    id: entityId(PatientSubscriptionPlanId),
});

export type DeactivatePatientSubscriptionPlanDto = z.infer<typeof deactivatePatientSubscriptionPlanSchema>;
