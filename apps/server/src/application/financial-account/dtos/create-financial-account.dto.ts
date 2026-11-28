import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {FinancialAccountType} from '@domain/financial-account/entities';

export const createFinancialAccountSchema = z.object({
    name: z.string().trim().min(1).max(120),
    type: z.nativeEnum(FinancialAccountType),
});

export class CreateFinancialAccountDto extends createZodDto(createFinancialAccountSchema) {}
