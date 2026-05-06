import * as PopoverPrimitive from '@radix-ui/react-popover';
import {clsx} from 'clsx';

import styles from './popover.module.css';

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
        className={clsx(styles.popoverContent, className)}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

export {Popover, PopoverTrigger, PopoverContent};
