import {debounce} from './debounce';

describe('debounce', () => {
    jest.useFakeTimers();

    it('should call the function after the wait time', () => {
        const func = jest.fn();
        const debouncedFunc = debounce(func, 200);

        debouncedFunc('call1');

        jest.advanceTimersByTime(200);

        expect(func).toHaveBeenCalledTimes(1);
        expect(func).toHaveBeenCalledWith('call1');
    });

    it('should not call the function if called again within the wait time', () => {
        const func = jest.fn();
        const debouncedFunc = debounce(func, 200);

        debouncedFunc('call1');
        debouncedFunc('call2');

        jest.advanceTimersByTime(100);

        expect(func).not.toHaveBeenCalled();

        jest.advanceTimersByTime(100);

        expect(func).toHaveBeenCalledTimes(1);
        expect(func).toHaveBeenCalledWith('call2');
    });

    it('should reset the wait time if called again', () => {
        const func = jest.fn();
        const debouncedFunc = debounce(func, 200);

        debouncedFunc('call1');
        jest.advanceTimersByTime(150);
        debouncedFunc('call2');

        jest.advanceTimersByTime(100);

        expect(func).not.toHaveBeenCalled();

        jest.advanceTimersByTime(100);

        expect(func).toHaveBeenCalledTimes(1);
        expect(func).toHaveBeenCalledWith('call2');
    });

    it('should receive multiple parameters', () => {
        const func = jest.fn((a: number, b: string) => `${a} ${b}`);
        const debouncedFunc = debounce(func);

        debouncedFunc(42, 'test');

        jest.advanceTimersByTime(300);

        expect(func).toHaveBeenCalledTimes(1);
        expect(func).toHaveBeenCalledWith(42, 'test');
    });

    it('should cancel the function call', () => {
        const func = jest.fn();
        const debouncedFunc = debounce(func, 200);

        debouncedFunc('call1');
        debouncedFunc.cancel();

        jest.advanceTimersByTime(200);

        expect(func).not.toHaveBeenCalled();
    });
});
