import {z} from 'zod';

export function pagination<U extends string, T extends [U, ...U[]]>(sortOptions: T) {
    return z
        .object({
            cursor: z.string().nullish().openapi({
                description: 'The cursor to start from',
                format: 'uuid',
            }),
            limit: z.coerce.number().positive().openapi({
                description: 'The number of items to return',
                example: 10,
            }),
            sort: z
                .record(z.enum<U, T>(sortOptions), z.enum(['asc', 'desc']))
                .nullish()
                .openapi({description: 'The fields to sort by'}),
        })
        .openapi({
            description: 'Pagination options',
            'x-param-object': true,
        });
}
