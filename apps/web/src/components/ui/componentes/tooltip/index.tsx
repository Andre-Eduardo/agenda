'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import {cx} from '@/styled-system/css';
import {tooltipContent} from './styles';

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
            className={cx(
                tooltipContent,
                'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                className
            )}
            {...props}
        />
    );
}

export {Tooltip, TooltipTrigger, TooltipContent, TooltipProvider};
