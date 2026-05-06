import type {MutableRefObject} from 'react';
import {renderHook} from '@testing-library/react';
import {useIntersectionObserver} from './useIntersectionObserver';

const observe = jest.fn();
const unobserve = jest.fn();

Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: jest.fn().mockImplementation(() => ({
        observe,
        unobserve,
    })),
});

describe('useIntersectionObserver', () => {
    it('should observe the target element', () => {
        const target: MutableRefObject<Element> = {
            current: document.createElement('div'),
        };

        const {unmount} = renderHook(() =>
            useIntersectionObserver({
                target,
                onIntersect: () => {},
                enabled: true,
            })
        );

        expect(observe).toHaveBeenCalledTimes(1);
        expect(observe).toHaveBeenCalledWith(target.current);

        unmount();

        expect(unobserve).toHaveBeenCalledTimes(1);
        expect(unobserve).toHaveBeenCalledWith(target.current);
    });

    it('should only observe the target element when enabled', () => {
        const target: MutableRefObject<Element> = {
            current: document.createElement('div'),
        };

        const {unmount} = renderHook(() =>
            useIntersectionObserver({
                target,
                onIntersect: () => {},
                enabled: false,
            })
        );

        expect(observe).not.toHaveBeenCalled();

        unmount();

        expect(unobserve).not.toHaveBeenCalled();
    });

    it('should call onIntersect callback when the target element intersects', () => {
        const target: MutableRefObject<Element> = {
            current: document.createElement('div'),
        };

        const onIntersect = jest.fn();

        renderHook(() =>
            useIntersectionObserver({
                target,
                onIntersect,
                enabled: true,
            })
        );

        const observerCallback = jest.mocked(window.IntersectionObserver).mock.calls[0][0];

        observerCallback([{isIntersecting: true} as IntersectionObserverEntry], {} as IntersectionObserver);

        expect(onIntersect).toHaveBeenCalledTimes(1);
    });
});
