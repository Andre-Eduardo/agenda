/**
 * Transforms all values of an object via a mapper function,
 * or maps values through a lookup dictionary.
 *
 * @example — mapper function
 * mapValues({ a: 1, b: 2 }, (v) => v * 2) // { a: 2, b: 4 }
 *
 * @example — lookup dictionary
 * mapValues({ severity: 'HIGH' }, { HIGH: 'bg-red', LOW: 'bg-gray' })
 * // { severity: 'bg-red' }
 */
export function mapValues<T extends object, V>(object: T, mapper: (value: T[keyof T]) => V): {[K in keyof T]: V};

export function mapValues<
    T extends {[key in keyof T]?: N},
    M extends object,
    N extends PropertyKey | undefined | null | NonNullable<unknown>,
>(
    ref: T,
    mapping: M
): {
    [K in keyof T]: T[K] extends keyof M ? M[T[K]] : T[K];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Needed to allow any Record
export function mapValues<I extends Record<any, any>, R extends Record<keyof I, any>>(
    ref: I | keyof R,
    mapping: ((value: I[keyof I] | PropertyKey) => R[keyof R]) | Partial<Record<I[keyof I] | keyof R, R[keyof R]>>
): R | R[keyof R] {
    if (['string', 'number', 'symbol'].includes(typeof ref)) {
        const key = ref as keyof R;

        if (typeof mapping === 'function') {
            return mapping(key);
        }

        return mapping[key] ?? (key as R[keyof R]);
    }

    const result: Partial<R> = {};

    for (const [key, value] of Object.entries(ref) as Array<[keyof I, I[keyof I]]>) {
        if (typeof mapping === 'function') {
            result[key] = (mapping as (value: I[keyof I]) => R[keyof R])(value);

            continue;
        }

        result[key] = value in mapping ? mapping[value] : value;
    }

    return result as R;
}
