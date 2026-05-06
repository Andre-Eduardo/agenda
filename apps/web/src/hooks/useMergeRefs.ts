import type {Ref, RefCallback, RefObject} from 'react';
import {useMemo} from 'react';

/**
 * Set the value of a ref.
 */
function setRef<T>(ref: RefCallback<T> | RefObject<T> | null | undefined, value: T): void {
    if (typeof ref === 'function') {
        ref(value);
    } else if (ref != null) {
        // eslint-disable-next-line no-param-reassign -- standard React ref-setting pattern
        ref.current = value;
    }
}

/**
 * Merges React refs into a single memoized function ref.
 *
 * @example
 * const Component = React.forwardRef((props, ref) => {
 *   const internalRef = React.useRef();
 *   return <div {...props} ref={useMergeRefs(internalRef, ref)} />;
 * });
 */
export function useMergeRefs<T>(...refs: Array<Ref<T> | undefined>): RefCallback<T> | null {
    return useMemo(
        () => {
            if (refs.every((ref) => ref == null)) {
                return null;
            }

            return (value: T) => refs.forEach((ref) => setRef(ref, value));
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps -- refs são a lista de dependências
        refs
    );
}
