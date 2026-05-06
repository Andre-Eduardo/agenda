type AnyFunction = (...args: never[]) => void;

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
