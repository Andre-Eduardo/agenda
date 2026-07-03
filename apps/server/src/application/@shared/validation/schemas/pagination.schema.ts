import {z} from 'zod';
import {Sort} from '@domain/@shared/repository/pagination';

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
                .preprocess(
                    // The global ZodValidationPipe (APP_PIPE) and the per-route pipe both run this
                    // schema against the same request, so the transform below executes twice. On
                    // the second pass `val` is already the `Array<Sort<T>>` shape produced by the
                    // first — convert it back to a record so validation/transform stay idempotent.
                    (val) =>
                        Array.isArray(val)
                            ? Object.fromEntries(
                                  val.map((entry) => [
                                      (entry as {key: unknown; direction: unknown}).key,
                                      (entry as {key: unknown; direction: unknown}).direction,
                                  ])
                              )
                            : val,
                    z.record(z.enum<U, T>(sortOptions), z.enum(['asc', 'desc']))
                )
                .nullish()
                .transform((val): Array<Sort<T>> | undefined => {
                    if (!val) return undefined;

                    return Object.entries(val).map(([key, direction]) => ({
                        key: key as U,
                        direction: direction as 'asc' | 'desc',
                    })) as Array<Sort<T>>;
                })
                .openapi({description: 'The fields to sort by'}),
        })
        .openapi({
            description: 'Pagination options',
            'x-param-object': true,
        });
}
