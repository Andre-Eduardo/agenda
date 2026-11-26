import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {email, password, username} from '@application/@shared/validation/schemas';

const createSupportUserSchema = z.object({
    name: z.string().min(1).openapi({example: 'Ana (Suporte)'}),
    username,
    email: email.nullish(),
    /** Temporary password; the support user can change it later or use "forgot password". */
    password,
});

export class CreateSupportUserDto extends createZodDto(createSupportUserSchema) {}
