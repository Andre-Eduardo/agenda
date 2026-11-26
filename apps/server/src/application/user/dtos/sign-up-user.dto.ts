import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {email, password, username} from '@application/@shared/validation/schemas';

export const signUpUserSchema = z.object({
    name: z.string().min(1).openapi({example: 'John Doe'}),
    username,
    email,
    password,
    /** Required when the server runs with SIGN_UP_MODE=invite. */
    inviteCode: z.string().max(256).nullish(),
});

export class SignUpUserDto extends createZodDto(signUpUserSchema) {}
