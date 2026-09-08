import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {AppointmentType} from '@domain/appointment/entities';

export const createPackagePlanSchema = z.object({
    name: z.string().min(1).max(255).openapi({example: '10 sessões de fisioterapia'}),
    description: z.string().nullish(),
    totalCredits: z.coerce.number().int().positive(),
    priceBrl: z.coerce.number().positive(),
    validityDays: z.coerce.number().int().positive().nullish(),
    appointmentType: z.nativeEnum(AppointmentType).nullish(),
});

export class CreatePackagePlanDto extends createZodDto(createPackagePlanSchema) {}
