'use client';

import * as ProgressPrimitive from '@radix-ui/react-progress';
import {cx} from '@/styled-system/css';
import {progressIndicator, progressRoot} from './styles';

function Progress({className, value, ref, ...props}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
    return (
        <ProgressPrimitive.Root ref={ref} className={cx(progressRoot, className)} {...props}>
            <ProgressPrimitive.Indicator
                className={progressIndicator}
                style={{transform: `translateX(-${100 - (value || 0)}%)`}}
            />
        </ProgressPrimitive.Root>
    );
}

export {Progress};
