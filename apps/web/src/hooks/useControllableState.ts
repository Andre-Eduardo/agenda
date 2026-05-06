import type {SetStateAction} from 'react';
import {useCallback, useState} from 'react';
import {useCallbackRef} from './useCallbackRef';

export type UseControllableStateProps<T> = {
    value?: T;
    defaultValue?: T | (() => T);
    onChange?: (value: T) => void;
};

/**
 * A hook to manage controlled and uncontrolled state.
 *
 * @param valueProp The controlled value.
 * @param defaultValue The default value for uncontrolled state.
 * @param onChange A callback to be called when the value changes.
 *
 * @returns A tuple with the current value and a function to update it, just like React `useState`.
 */
export function useControllableState<T>({value: valueProp, defaultValue, onChange}: UseControllableStateProps<T>) {
    const onChangeProp = useCallbackRef(onChange);

    const [uncontrolledState, setUncontrolledState] = useState(defaultValue);
    const controlled = valueProp !== undefined;
    const value = controlled ? valueProp : uncontrolledState;

    const setValue = useCallback(
        (next: SetStateAction<T>) => {
            const setter = next as (prevState?: T) => T;
            const nextValue = typeof next === 'function' ? setter(value) : next;

            if (value === nextValue) {
                return;
            }

            if (!controlled) {
                setUncontrolledState(nextValue);
            }

            onChangeProp(nextValue);
        },
        [controlled, onChangeProp, value]
    );

    return [value, setValue] as const;
}
