import {z} from 'zod';
import {Username} from '../../../../domain/user/value-objects';

export const username = z
    .string()
    .transform((value, ctx) => {
        try {
            return Username.create(value);
        } catch (e) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: e instanceof Error ? e.message : 'Invalid username format',
            });

            return z.NEVER;
        }
    })
    .openapi({
        example: 'john_doe',
    });
