type AnyFunction = (...args: never[]) => void;

/**
 * Returns a debounced version of the given function that delays execution
 * until `ms` milliseconds have elapsed since the last call.
 *
 * The returned function has a `.cancel()` method to clear any pending call.
 *
 * @param fn  Function to debounce.
 * @param ms  Delay in milliseconds. Default: 300ms.
 *
 * @example
 * const search = debounce((query: string) => fetch(`/search?q=${query}`), 400);
 * input.addEventListener('input', (e) => search(e.target.value));
 * // On unmount:
 * search.cancel();
 */
export const debounce = <F extends AnyFunction>(
    fn: F,
    ms = 300
): ((...args: Parameters<F>) => void) & {cancel: () => void} => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const debouncedFn = function debouncedFn<U>(this: U, ...args: Parameters<F>) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), ms);
    };

    debouncedFn.cancel = () => {
        clearTimeout(timeoutId);
    };

    return debouncedFn;
};
