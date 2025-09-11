import {z} from 'zod';
import {Email} from '../../../../domain/@shared/value-objects';

export const email = z
    .string()
    .transform((value, ctx) => {
        try {
            return Email.create(value);
        } catch (e) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Invalid email format',
            });

            return z.NEVER;
        }
    })
    .openapi({
        example: 'john.doe@example.com',
    });
