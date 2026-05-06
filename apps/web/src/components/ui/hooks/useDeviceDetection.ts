import {useEffect, useState} from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export const useDeviceDetection = (): DeviceType => {
    const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

    useEffect(() => {
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobile =
            /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|rim)|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
                userAgent
            );
        const isTablet =
            /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(
                userAgent
            );

        if (isMobile) {
            setDeviceType('mobile');
        } else if (isTablet) {
            setDeviceType('tablet');
        } else {
            setDeviceType('desktop');
        }
    }, []);

    return deviceType;
};
