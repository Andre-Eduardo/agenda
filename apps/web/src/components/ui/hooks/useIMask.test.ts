import {act, renderHook} from '@testing-library/react';
import IMask, {type InputMask, type FactoryArg} from 'imask';
import {useIMask} from './useIMask';

jest.mock('imask', () => ({
    __esModule: true,
    default: jest.fn(),
}));

describe('useIMask', () => {
    let destroy: jest.Mock;
    let on: jest.Mock;

    const createMask = (): InputMask<FactoryArg> => {
        destroy = jest.fn();
        on = jest.fn();

        return {
            value: 'masked',
            unmaskedValue: 'unmasked',
            on,
            destroy,
        } as unknown as InputMask<FactoryArg>;
    };

    const mockedIMask = jest.mocked(IMask);

    beforeEach(() => {
        jest.clearAllMocks();
        mockedIMask.mockImplementation(() => createMask());
    });

    it('should not initialize mask when opts is undefined', () => {
        const {result} = renderHook(() => useIMask(undefined));

        act(() => {
            result.current.ref(document.createElement('input'));
        });

        expect(mockedIMask).not.toHaveBeenCalled();
    });

    it('should initialize mask when ref is set and opts is provided', () => {
        const {result} = renderHook(() => useIMask({mask: '000'}));

        const input = document.createElement('input');

        act(() => {
            result.current.ref(input);
        });

        expect(mockedIMask).toHaveBeenCalledWith(input, {mask: '000'});
    });

    it('should call onAccept when mask emits accept', () => {
        let acceptHandler: () => void = () => {};

        const onAccept = jest.fn();

        mockedIMask.mockImplementation(() => {
            const mask = createMask();

            on.mockImplementation((event, cb) => {
                if (event === 'accept') acceptHandler = cb;
            });

            return mask;
        });

        const {result} = renderHook(() => useIMask({mask: '000'}, {onAccept}));

        act(() => {
            result.current.ref(document.createElement('input'));
        });

        act(() => {
            acceptHandler();
        });

        expect(onAccept).toHaveBeenCalledWith('masked', 'unmasked', expect.any(Object));
    });

    it('should call onComplete when mask emits complete', () => {
        let completeHandler: () => void = () => {};

        const onComplete = jest.fn();

        mockedIMask.mockImplementation(() => {
            const mask = createMask();

            on.mockImplementation((event, cb) => {
                if (event === 'complete') completeHandler = cb;
            });

            return mask;
        });

        const {result} = renderHook(() => useIMask({mask: '000'}, {onComplete}));

        act(() => {
            result.current.ref(document.createElement('input'));
        });

        act(() => {
            completeHandler();
        });

        expect(onComplete).toHaveBeenCalledWith('masked', 'unmasked', expect.any(Object));
    });

    it('should destroy mask on unmount', () => {
        const {result, unmount} = renderHook(() => useIMask({mask: '000'}));

        act(() => {
            result.current.ref(document.createElement('input'));
        });

        unmount();

        expect(destroy).toHaveBeenCalled();
    });

    it('should destroy previous mask before creating a new one', () => {
        const {result, rerender} = renderHook(({opts}) => useIMask(opts), {initialProps: {opts: {mask: '000'}}});

        const input = document.createElement('input');

        act(() => {
            result.current.ref(input);
        });

        const firstDestroy = destroy;

        rerender({opts: {mask: '0000'}});

        act(() => {
            result.current.ref(input);
        });

        expect(firstDestroy).toHaveBeenCalledTimes(1);
    });

    it('should recreate mask when opts changes', () => {
        const {result, rerender} = renderHook(({opts}) => useIMask(opts), {initialProps: {opts: {mask: '000'}}});

        const input = document.createElement('input');

        act(() => {
            result.current.ref(input);
        });

        rerender({opts: {mask: '0000'}});

        act(() => {
            result.current.ref(input);
        });

        expect(mockedIMask).toHaveBeenLastCalledWith(input, {mask: '0000'});
    });
});
