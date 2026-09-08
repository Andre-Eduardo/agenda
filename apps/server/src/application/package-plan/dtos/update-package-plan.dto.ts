import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {entityId} from '@application/@shared/validation/schemas';
import {AppointmentType} from '@domain/appointment/entities';
import {PackagePlanId} from '@domain/package-plan/entities';

export const updatePackagePlanInputSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().nullish(),
    totalCredits: z.coerce.number().int().positive().optional(),
    priceBrl: z.coerce.number().positive().optional(),
    validityDays: z.coerce.number().int().positive().nullish(),
    appointmentType: z.nativeEnum(AppointmentType).nullish(),
});

export class UpdatePackagePlanInputDto extends createZodDto(updatePackagePlanInputSchema) {}

export const updatePackagePlanSchema = updatePackagePlanInputSchema.extend({
    id: entityId(PackagePlanId),
});

export type UpdatePackagePlanDto = z.infer<typeof updatePackagePlanSchema>;

export const deactivatePackagePlanSchema = z.object({
    id: entityId(PackagePlanId),
});

export type DeactivatePackagePlanDto = z.infer<typeof deactivatePackagePlanSchema>;
