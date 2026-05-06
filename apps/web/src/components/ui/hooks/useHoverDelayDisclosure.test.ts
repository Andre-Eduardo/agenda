import {act, renderHook} from '@testing-library/react';
import {useHoverDelayDisclosure} from './useHoverDelayDisclosure';

describe('useHoverDelayDisclosure', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should return default functions', () => {
        const {result} = renderHook(() => useHoverDelayDisclosure());

        expect(typeof result.current.cancelClose).toBe('function');
        expect(typeof result.current.scheduleClose).toBe('function');
        expect(typeof result.current.getBoundaryProps).toBe('function');
    });

    it('should return boundary props with event handlers', () => {
        const {result} = renderHook(() => useHoverDelayDisclosure());
        const boundaryProps = result.current.getBoundaryProps();

        expect(typeof boundaryProps.onPointerEnter).toBe('function');
        expect(typeof boundaryProps.onPointerLeave).toBe('function');
        expect(typeof boundaryProps.onFocusCapture).toBe('function');
        expect(typeof boundaryProps.onBlurCapture).toBe('function');
    });

    it('should call onClose after closeDelay', () => {
        const onClose = jest.fn();
        const {result} = renderHook(() => useHoverDelayDisclosure({onClose, closeDelay: 400}));

        act(() => {
            result.current.scheduleClose();
        });

        expect(onClose).not.toHaveBeenCalled();

        act(() => {
            jest.advanceTimersByTime(400);
        });

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should use default closeDelay of 500ms', () => {
        const onClose = jest.fn();
        const {result} = renderHook(() => useHoverDelayDisclosure({onClose}));

        act(() => {
            result.current.scheduleClose();
        });

        act(() => {
            jest.advanceTimersByTime(499);
        });

        expect(onClose).not.toHaveBeenCalled();

        act(() => {
            jest.advanceTimersByTime(1);
        });

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should cancel scheduled close when cancelClose is called', () => {
        const onClose = jest.fn();
        const {result} = renderHook(() => useHoverDelayDisclosure({onClose, closeDelay: 400}));

        act(() => {
            result.current.scheduleClose();
        });

        act(() => {
            jest.advanceTimersByTime(200);
        });

        act(() => {
            result.current.cancelClose();
        });

        act(() => {
            jest.advanceTimersByTime(400);
        });

        expect(onClose).not.toHaveBeenCalled();
    });

    it('should cancel close on pointer enter via getBoundaryProps', () => {
        const onClose = jest.fn();
        const {result} = renderHook(() => useHoverDelayDisclosure({onClose, closeDelay: 400}));

        act(() => {
            result.current.scheduleClose();
        });

        act(() => {
            jest.advanceTimersByTime(200);
        });

        const boundaryProps = result.current.getBoundaryProps();

        act(() => {
            boundaryProps.onPointerEnter();
        });

        act(() => {
            jest.advanceTimersByTime(400);
        });

        expect(onClose).not.toHaveBeenCalled();
    });

    it('should cancel close on focus capture via getBoundaryProps', () => {
        const onClose = jest.fn();
        const {result} = renderHook(() => useHoverDelayDisclosure({onClose, closeDelay: 400}));

        act(() => {
            result.current.scheduleClose();
        });

        act(() => {
            jest.advanceTimersByTime(200);
        });

        const boundaryProps = result.current.getBoundaryProps();

        act(() => {
            boundaryProps.onFocusCapture();
        });

        act(() => {
            jest.advanceTimersByTime(400);
        });

        expect(onClose).not.toHaveBeenCalled();
    });

    it('should schedule close on pointer leave via getBoundaryProps', () => {
        const onClose = jest.fn();
        const {result} = renderHook(() => useHoverDelayDisclosure({onClose, closeDelay: 400}));

        const boundaryProps = result.current.getBoundaryProps();

        act(() => {
            const event = {
                relatedTarget: null,
                currentTarget: document.createElement('div'),
            } as unknown as React.PointerEvent;

            boundaryProps.onPointerLeave(event);
        });

        act(() => {
            jest.advanceTimersByTime(400);
        });

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not schedule close if pointer leaves to element inside boundary', () => {
        const onClose = jest.fn();
        const {result} = renderHook(() => useHoverDelayDisclosure({onClose, closeDelay: 400}));

        const boundaryProps = result.current.getBoundaryProps();

        const parent = document.createElement('div');
        const child = document.createElement('div');

        parent.appendChild(child);

        act(() => {
            const event = {
                relatedTarget: child,
                currentTarget: parent,
            } as unknown as React.PointerEvent;

            boundaryProps.onPointerLeave(event);
        });

        act(() => {
            jest.advanceTimersByTime(400);
        });

        expect(onClose).not.toHaveBeenCalled();
    });

    it('should schedule close on blur capture via getBoundaryProps', () => {
        const onClose = jest.fn();
        const {result} = renderHook(() => useHoverDelayDisclosure({onClose, closeDelay: 400}));

        const boundaryProps = result.current.getBoundaryProps();

        act(() => {
            const event = {
                relatedTarget: null,
                currentTarget: document.createElement('div'),
            } as unknown as React.FocusEvent;

            boundaryProps.onBlurCapture(event);
        });

        act(() => {
            jest.advanceTimersByTime(400);
        });

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not schedule close on blur if focus moves inside boundary', () => {
        const onClose = jest.fn();
        const {result} = renderHook(() => useHoverDelayDisclosure({onClose, closeDelay: 400}));

        const boundaryProps = result.current.getBoundaryProps();

        const parent = document.createElement('div');
        const child = document.createElement('div');

        parent.appendChild(child);

        act(() => {
            const event = {
                relatedTarget: child,
                currentTarget: parent,
            } as unknown as React.FocusEvent;

            boundaryProps.onBlurCapture(event);
        });

        act(() => {
            jest.advanceTimersByTime(400);
        });

        expect(onClose).not.toHaveBeenCalled();
    });

    it('should clear timers on unmount', () => {
        const onClose = jest.fn();
        const {result, unmount} = renderHook(() => useHoverDelayDisclosure({onClose, closeDelay: 400}));

        act(() => {
            result.current.scheduleClose();
        });

        unmount();

        act(() => {
            jest.advanceTimersByTime(400);
        });

        expect(onClose).not.toHaveBeenCalled();
    });

    it('should replace previous scheduled close when scheduleClose is called multiple times', () => {
        const onClose = jest.fn();
        const {result} = renderHook(() => useHoverDelayDisclosure({onClose, closeDelay: 400}));

        act(() => {
            result.current.scheduleClose();
        });

        act(() => {
            jest.advanceTimersByTime(200);
        });

        act(() => {
            result.current.scheduleClose();
        });

        act(() => {
            jest.advanceTimersByTime(200);
        });

        expect(onClose).not.toHaveBeenCalled();

        act(() => {
            jest.advanceTimersByTime(200);
        });

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
