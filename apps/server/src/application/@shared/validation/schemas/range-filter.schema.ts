import type {ZodType} from 'zod';
import {z} from 'zod';

export const rangeFilter = <T extends ZodType>(zodType: T) =>
    z
        .object({
            from: zodType.openapi({description: 'The lower bound of the range.'}),
            to: zodType.openapi({description: 'The upper bound of the range.'}),
        })
        .refine((value) => value.from! <= value.to!, {
            message: "The 'from' value cannot be greater than the 'to' value.",
        })
        .openapi({
            description: 'A range filter.',
            'x-param-object': true,
        });

export const nullableRangeFilter = <T extends ZodType>(zodType: T) =>
    z
        .preprocess((value) => (value === '' ? null : value), rangeFilter(zodType).nullish())
        .openapi({
            description: 'A nullable range filter.',
            'x-param-object': true,
        });
