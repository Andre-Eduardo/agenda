import {act, renderHook} from '@testing-library/react';
import {useDisclosure} from './useDisclosure';

describe('useDisclosure', () => {
    it('should return default values', () => {
        const {result} = renderHook(() => useDisclosure());

        expect(result.current.isOpen).toBe(false);
        expect(typeof result.current.open).toBe('function');
        expect(typeof result.current.close).toBe('function');
        expect(typeof result.current.toggle).toBe('function');
    });

    it('can be controlled', () => {
        const {result} = renderHook(() => useDisclosure({isOpen: true}));

        expect(result.current.isOpen).toBe(true);
    });

    it('can be uncontrolled', () => {
        const {result} = renderHook(() => useDisclosure({defaultIsOpen: true}));

        expect(result.current.isOpen).toBe(true);
    });

    it('should call onOpen callback', () => {
        const onOpen = jest.fn();
        const onToggle = jest.fn();
        const {result} = renderHook(() => useDisclosure({onOpen, onToggle}));

        act(() => {
            result.current.open();
        });

        expect(onOpen).toHaveBeenCalled();
        expect(onToggle).toHaveBeenCalledWith(true);
    });

    it('should call onClose callback', () => {
        const onClose = jest.fn();
        const onToggle = jest.fn();
        const {result} = renderHook(() => useDisclosure({isOpen: true, onClose, onToggle}));

        act(() => {
            result.current.close();
        });

        expect(onClose).toHaveBeenCalled();
        expect(onToggle).toHaveBeenCalledWith(false);
    });

    it('should toggle the state', () => {
        const {result} = renderHook(() => useDisclosure());

        act(() => {
            result.current.toggle();
        });

        expect(result.current.isOpen).toBe(true);

        act(() => {
            result.current.toggle();
        });

        expect(result.current.isOpen).toBe(false);
    });
});
