import {createZodDto} from 'nestjs-zod';
import {z} from 'zod';

export const createClinicSchema = z.object({
    name: z.string().min(1).max(255),
    documentId: z.string().nullish(),
    phone: z.string().nullish(),
    email: z.string().email().nullish(),
    isPersonalClinic: z.boolean().default(false),
});

export class CreateClinicDto extends createZodDto(createClinicSchema) {}
