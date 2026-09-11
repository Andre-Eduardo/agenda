import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';

export const createPatientSubscriptionPlanSchema = z.object({
    name: z.string().min(1).max(255).openapi({example: 'Mensal 4 sessões'}),
    description: z.string().nullish(),
    monthlyAppointmentQuota: z.coerce.number().int().positive(),
    priceBrl: z.coerce.number().positive(),
});

export class CreatePatientSubscriptionPlanDto extends createZodDto(createPatientSubscriptionPlanSchema) {}
