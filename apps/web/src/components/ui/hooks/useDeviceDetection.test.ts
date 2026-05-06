import {renderHook} from '@testing-library/react';
import {useDeviceDetection} from './useDeviceDetection';

const setUserAgent = (userAgent: string) => {
    Object.defineProperty(window.navigator, 'userAgent', {
        value: userAgent,
        configurable: true,
    });
};

describe('useDeviceDetection', () => {
    afterEach(() => {
        setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    });

    it('should detect desktop by default', () => {
        setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
        const {result} = renderHook(() => useDeviceDetection());

        expect(result.current).toBe('desktop');
    });

    it('should detect mobile', () => {
        setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) Mobile');
        const {result} = renderHook(() => useDeviceDetection());

        expect(result.current).toBe('mobile');
    });

    it('should detect tablet', () => {
        setUserAgent('Mozilla/5.0 (iPad; CPU OS 13_2 like Mac OS X) Tablet');
        const {result} = renderHook(() => useDeviceDetection());

        expect(result.current).toBe('tablet');
    });

    it('should detect Android tablet', () => {
        setUserAgent('Mozilla/5.0 (Linux; Android 9; SM-T865) Tablet');
        const {result} = renderHook(() => useDeviceDetection());

        expect(result.current).toBe('tablet');
    });

    it('should detect Android mobile', () => {
        setUserAgent('Mozilla/5.0 (Linux; Android 10; SM-G975F) Mobile');
        const {result} = renderHook(() => useDeviceDetection());

        expect(result.current).toBe('mobile');
    });
});
