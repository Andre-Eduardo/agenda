import {z} from 'zod';
import {createZodDto} from '../../@shared/validation/dto';

export const createCompanySchema = z.object({
    name: z.string().min(1).openapi({example: 'Ecxus'}),
});

export class CreateCompanyDto extends createZodDto(createCompanySchema) {}
