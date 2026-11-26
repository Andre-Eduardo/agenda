import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import {password} from '@application/@shared/validation/schemas';

const resetPasswordSchema = z.object({
    /** Token from the link sent by e-mail (`/auth/reset-password?token=...`). */
    token: z.string().min(1).max(4096),
    newPassword: password,
});

export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}
