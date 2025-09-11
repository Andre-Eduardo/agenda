import {z} from 'zod';
import {createZodDto} from '../../@shared/validation/dto';
import {email, password, username} from '../../@shared/validation/schemas';

export const signUpUserSchema = z.object({
    firstName: z.string().min(1).openapi({example: 'John'}),
    lastName: z.string().min(1).nullish().openapi({example: 'Doe'}),
    username,
    email,
    password,
});

export class SignUpUserDto extends createZodDto(signUpUserSchema) {}
