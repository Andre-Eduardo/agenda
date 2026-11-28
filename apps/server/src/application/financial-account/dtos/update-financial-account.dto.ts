import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';

export const updateFinancialAccountSchema = z.object({
    name: z.string().trim().min(1).max(120).optional(),
    active: z.boolean().optional(),
});

export class UpdateFinancialAccountDto extends createZodDto(updateFinancialAccountSchema) {}
