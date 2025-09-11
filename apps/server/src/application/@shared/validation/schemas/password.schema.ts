import {z} from 'zod';
import {ObfuscatedPassword} from '../../../../domain/user/value-objects';

export const password = z
    .string()
    .transform((value, ctx) => {
        try {
            ObfuscatedPassword.validate(value);

            return value;
        } catch (e) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: e instanceof Error ? e.message : 'Invalid password format',
            });

            return z.NEVER;
        }
    })
    .openapi({
        example: 'J0hn@d03',
    });
