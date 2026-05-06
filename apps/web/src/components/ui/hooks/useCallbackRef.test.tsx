import {renderHook, act} from '@testing-library/react';
import {useCallbackRef} from './useCallbackRef';

describe('useCallbackRef', () => {
    it('should return a function', () => {
        const {result} = renderHook(() => useCallbackRef(() => {}));

        expect(typeof result.current).toBe('function');
    });

    it('should return the same function on multiple renders', () => {
        const {result, rerender} = renderHook(() => useCallbackRef(() => {}));
        const firstCallback = result.current;

        rerender();
        expect(result.current).toBe(firstCallback);
    });

    it('should update the reference when the callback changes', () => {
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        const {result, rerender} = renderHook(({callback}) => useCallbackRef(callback), {
            initialProps: {callback: callback1},
        });

        result.current();

        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).not.toHaveBeenCalled();

        rerender({callback: callback2});

        result.current();

        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should call the callback with the correct arguments', () => {
        const callback = jest.fn();
        const {result} = renderHook(() => useCallbackRef(callback));

        act(() => {
            result.current('arg1', 'arg2');
        });

        expect(callback).toHaveBeenCalledWith('arg1', 'arg2');
    });
});
