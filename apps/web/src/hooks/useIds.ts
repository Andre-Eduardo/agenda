import {useId} from 'react';

type OptionalId = {
    id: string;
    when: boolean;
};

type Result<T> = {
    [K in keyof T]: T[K] extends string ? string : T[K] extends OptionalId ? string | undefined : undefined;
};

/**
 * Generate unique IDs for the given arguments.
 *
 * If the two arguments are the same, the generated IDs will also be the same.
 *
 * @example
 * const [inputId, labelId] = useIds('input', {id: 'label', when: label !== undefined});
 *
 * @param ids - The IDs to use for generating the unique ids.
 * @returns An array of unique IDs.
 */
export function useIds<T extends Array<string | undefined | OptionalId>>(...ids: T): Result<T> {
    const randomId = useId();

    return ids.map((arg) => {
        if (arg === undefined) {
            return undefined;
        }

        if (typeof arg === 'string') {
            return `${randomId}-${arg}`;
        }

        return arg.when ? `${randomId}-${arg.id}` : undefined;
    }) as Result<T>;
}
