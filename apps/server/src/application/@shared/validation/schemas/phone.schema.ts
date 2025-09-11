import {z} from 'zod';
import {Phone} from '../../../../domain/@shared/value-objects';

export function phone() {
    return z
        .string()
        .transform((value, ctx) => {
            try {
                return Phone.create(value);
            } catch {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Invalid phone',
                });

                return z.NEVER;
            }
        })
        .openapi({example: '(12) 94567-8912'});
}
