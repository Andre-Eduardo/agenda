import {createRef} from 'react';
import {renderHook} from '@testing-library/react';
import {useMergeRefs} from './useMergeRefs';

describe('useMergeRefs', () => {
    it('should render the hook without errors', () => {
        expect(() => {
            const {result} = renderHook(() => useMergeRefs());

            expect(result.current).toBeNull();
        }).not.toThrow();
    });

    it('should set the refs to the same value', () => {
        const containerRef = createRef();

        const inputRef = jest.fn();

        const {result} = renderHook(() => useMergeRefs(containerRef, inputRef));

        const value = document.createElement('div');

        result.current?.(value);

        expect(containerRef.current).toStrictEqual(value);

        expect(inputRef).toHaveBeenCalledWith(value);
    });
});
