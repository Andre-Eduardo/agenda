import {useEffect, useState} from 'react';

export type UseTouchDeviceProps = {
    enabled?: boolean;
};

export function useTouchDevice({enabled = true}: UseTouchDeviceProps = {}) {
    const [isTouch, setIsTouch] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia || !enabled) {
            return undefined;
        }

        const checkDeviceType = () => {
            const touchOnlyQuery = window.matchMedia('(pointer: coarse)');

            setIsTouch(touchOnlyQuery.matches);
        };

        checkDeviceType();

        window.addEventListener('change', checkDeviceType);

        return () => {
            window.removeEventListener('change', checkDeviceType);
        };
    }, [enabled]);

    return isTouch;
}
