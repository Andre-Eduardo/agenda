import {act, renderHook} from '@testing-library/react';
import {useTouchDevice} from './useTouchDevice';

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

function mockMatchMedia(matches: boolean): void {
    jest.mocked(window.matchMedia).mockImplementation((query) => ({
        matches,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    }));
}

describe('useTouchDevice', () => {
    it.each<[boolean]>([[true], [false]])('should return the current matchMedia state (%s)', (matches) => {
        mockMatchMedia(matches);

        const {result} = renderHook(() => useTouchDevice());

        expect(result.current).toEqual(matches);
        expect(window.matchMedia).toHaveBeenCalledWith('(pointer: coarse)');
    });

    it('should update when the device type changes', () => {
        const matchMediaMock = jest.mocked(window.matchMedia);

        matchMediaMock
            .mockReturnValueOnce({
                matches: false,
                media: '(pointer: coarse)',
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            })
            .mockReturnValueOnce({
                matches: true,
                media: '(pointer: coarse)',
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            });

        const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

        const {result} = renderHook(() => useTouchDevice());

        expect(result.current).toEqual(false);

        const changeHandler = addEventListenerSpy.mock.calls.find(([eventName]) => eventName === 'change')?.[1] as (
            event: Event
        ) => void;

        act(() => {
            changeHandler(new Event('change'));
        });

        expect(result.current).toEqual(true);
    });

    it('should remove the event listener on unmount', () => {
        const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
        const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

        const {unmount} = renderHook(() => useTouchDevice());

        expect(addEventListenerSpy).toHaveBeenCalledTimes(1);

        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledTimes(1);
    });
});
