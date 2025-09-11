import {z} from 'zod';
import {Permission} from '../../../../domain/auth';

export const permission = z
    .string()
    .transform((value, ctx) => {
        try {
            return Permission.of(value);
        } catch (e) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Invalid permission',
            });

            return z.NEVER;
        }
    })
    .openapi({
        enum: [...Permission.all()],
    });

export const permissions = z
    .array(permission)
    .transform((value) => new Set<Permission>(value))
    .openapi({
        enumName: 'Permission',
        isArray: true,
    });
