import {useCallback, useEffect, useRef} from 'react';

type AnyFunction = (...args: never[]) => void;

/**
 * Creates a stable callback function.
 *
 * The hook creates a stable callback with access to the latest state,
 * so it can be safely included in the dependency list of other hooks
 * without triggering them on every render.
 *
 * @param callback The callback function to stabilize.
 * @returns T A stable callback function.
 */
export function useCallbackRef<T extends AnyFunction>(callback: T | undefined): T {
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    return useCallback<AnyFunction>((...args) => callbackRef.current?.(...args), []) as T;
}
