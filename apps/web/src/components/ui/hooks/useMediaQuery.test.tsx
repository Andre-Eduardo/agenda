import {useTheme} from '@emotion/react';
import {renderHook} from '@testing-library/react';
import type {Theme} from '../styles/theme';
import type {Constraints} from './useMediaQuery';
import {useMediaQuery} from './useMediaQuery';

jest.mock('@emotion/react', () => ({
    __esModule: true,
    ...jest.requireActual('@emotion/react'),
    useTheme: jest.fn(() => ({
        sizes: {
            sm: '640px',
            md: '768px',
            lg: '1024px',
            xl: '1280px',
        },
    })),
}));

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

function mockMatchMedia(options?: Partial<MediaQueryList>): void {
    jest.mocked(window.matchMedia).mockImplementationOnce((query) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
        ...options,
    }));
}

describe('useMediaQueryWatcher', () => {
    it('should throw an error when the sizes are not defined', () => {
        const mockTheme: Partial<Theme> = {sizes: undefined};

        renderHook(() => {
            jest.mocked(useTheme).mockReturnValueOnce(mockTheme as Theme);
            expect(() => useMediaQuery({maxWidth: 'sm'})).toThrow('Missing breakpoint definition.');
        });
    });

    it.each<[Constraints, boolean, string]>([
        [{maxWidth: 'sm'}, true, '(max-width: 640px)'],
        [{minWidth: 'md'}, false, '(min-width: 768px)'],
        [{maxHeight: 'lg'}, false, '(max-height: 1024px)'],
        [{minHeight: 'xl'}, true, '(min-height: 1280px)'],
        [{maxWidth: '300px'}, false, '(max-width: 300px)'],
        [{minWidth: '400px'}, true, '(min-width: 400px)'],
        [{maxHeight: '500px'}, false, '(max-height: 500px)'],
        [{minHeight: '600px'}, true, '(min-height: 600px)'],
        [{minWidth: 'md', maxWidth: 'lg'}, true, '(min-width: 768px) and (max-width: 1024px)'],
        [{minHeight: 'sm', maxHeight: 'xl'}, true, '(min-height: 640px) and (max-height: 1280px)'],
        [
            {minWidth: 'md', maxWidth: 'lg', minHeight: 'sm', maxHeight: 'xl'},
            true,
            '(min-width: 768px) and (max-width: 1024px) and (min-height: 640px) and (max-height: 1280px)',
        ],
    ])('should check if the breakpoint matches', (constraint, matches, query) => {
        mockMatchMedia({
            addEventListener: jest
                .fn()
                .mockImplementationOnce((_, handler: (ev: Partial<MediaQueryListEvent>) => unknown) => {
                    handler({matches});
                }),
        });

        const {result} = renderHook(() => useMediaQuery(constraint));

        expect(result.current).toEqual(matches);

        expect(window.matchMedia).toHaveBeenCalledWith(query);
    });

    it('should remove the events listeners on rerenders', () => {
        const addEventListenerSpy = jest.fn();
        const removeEventListenerSpy = jest.fn();

        mockMatchMedia({
            addEventListener: addEventListenerSpy,
            removeEventListener: removeEventListenerSpy,
        });

        const {rerender} = renderHook(() => useMediaQuery({maxWidth: 'sm'}));

        expect(addEventListenerSpy).toHaveBeenCalledTimes(1);

        rerender({maxWidth: 'md'});

        expect(removeEventListenerSpy).toHaveBeenCalledTimes(1);
    });
});
