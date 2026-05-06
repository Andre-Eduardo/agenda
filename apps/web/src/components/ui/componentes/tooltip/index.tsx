'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import {clsx} from 'clsx';
import styles from './tooltip.module.css';

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

function TooltipContent({
    className,
    sideOffset = 4,
    ref,
    ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
    return (
        <TooltipPrimitive.Content
            ref={ref}
            sideOffset={sideOffset}
            className={clsx(styles.tooltipContent, className)}
            {...props}
        />
    );
}

export {Tooltip, TooltipTrigger, TooltipContent, TooltipProvider};
