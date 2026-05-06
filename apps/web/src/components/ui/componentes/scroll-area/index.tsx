import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import {clsx} from 'clsx';

import styles from './scroll-area.module.css';

function ScrollArea({
  className,
  children,
  ref,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={clsx(styles.scrollArea, className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport className={styles.scrollAreaViewport}>
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollBar({
  className,
  orientation = 'vertical',
  ref,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      ref={ref}
      orientation={orientation}
      className={clsx(
        styles.scrollBar,
        orientation === 'vertical'   && styles.scrollBarVertical,
        orientation === 'horizontal' && styles.scrollBarHorizontal,
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb className={styles.scrollBarThumb} />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}

export {ScrollArea, ScrollBar};
