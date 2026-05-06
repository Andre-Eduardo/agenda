import {act, renderHook} from '@testing-library/react';
import {useControllableState} from './useControllableState';

describe('useControllableState', () => {
    it('should be uncontrolled when only the defaultValue is passed', () => {
        const {result} = renderHook(() => useControllableState({defaultValue: 'foo'}));
        const [value, setValue] = result.current;

        expect(value).toBe('foo');

        act(() => {
            setValue('bar');
        });

        const [next] = result.current;

        expect(next).toBe('bar');
    });

    it('should be controlled when the value is passed', () => {
        const {result} = renderHook(() => useControllableState({value: 'foo'}));
        const [value, setValue] = result.current;

        expect(value).toBe('foo');

        act(() => {
            setValue('bar');
        });

        // The value should not change since the caller is responsible for updating it in the onChange callback.
        const [next] = result.current;

        expect(next).toBe('foo');
    });

    it('should call the onChange callback for uncontrolled state', () => {
        const onChange = jest.fn();

        const {result} = renderHook(() => useControllableState({defaultValue: 'foo', onChange}));
        const [, setValue] = result.current;

        act(() => {
            setValue('bar');
        });

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('bar');
    });

    it('should call the onChange callback for controlled state', () => {
        const onChange = jest.fn();

        const {result} = renderHook(() => useControllableState({value: 'foo', defaultValue: 'bar', onChange}));
        const [, setValue] = result.current;

        setValue('baz');

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('baz');
    });

    it('should not call the onChange callback when the value is the same for controlled state', () => {
        const onChange = jest.fn();

        const {result} = renderHook(() => useControllableState({value: 'foo', onChange}));
        const [, setValue] = result.current;

        setValue('foo');

        expect(onChange).not.toHaveBeenCalled();
    });

    it('should not call the onChange callback when the value is the same for uncontrolled state', () => {
        const onChange = jest.fn();

        const {result} = renderHook(() => useControllableState({defaultValue: 'foo', onChange}));
        const [, setValue] = result.current;

        setValue('foo');

        expect(onChange).not.toHaveBeenCalled();
    });

    it('can use a function to update the state', () => {
        const onChange = jest.fn();

        const {result} = renderHook(() => useControllableState({defaultValue: 'foo', onChange}));
        const [, setValue] = result.current;

        act(() => {
            setValue((prev) => `${prev}bar`);
        });

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('foobar');
    });
});
