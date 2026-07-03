import * as PopoverPrimitive from '@radix-ui/react-popover';
import {cx} from '@/styled-system/css';
import {popoverContent} from './styles';

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;

function PopoverContent({
    className,
    align = 'center',
    sideOffset = 4,
    ref,
    ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
    return (
        <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
                ref={ref}
                align={align}
                sideOffset={sideOffset}
                className={cx(
                    popoverContent,
                    'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                    className
                )}
                {...props}
            />
        </PopoverPrimitive.Portal>
    );
}

export {Popover, PopoverTrigger, PopoverContent};
