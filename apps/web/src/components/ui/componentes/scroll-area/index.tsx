import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import {cx} from '@/styled-system/css';
import {
    scrollArea,
    scrollAreaViewport,
    scrollBar,
    scrollBarHorizontal,
    scrollBarThumb,
    scrollBarVertical,
} from './styles';

function ScrollArea({className, children, ref, ...props}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
    return (
        <ScrollAreaPrimitive.Root ref={ref} className={cx(scrollArea, className)} {...props}>
            <ScrollAreaPrimitive.Viewport className={scrollAreaViewport}>
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
            className={cx(
                scrollBar,
                orientation === 'vertical' && scrollBarVertical,
                orientation === 'horizontal' && scrollBarHorizontal,
                className
            )}
            {...props}
        >
            <ScrollAreaPrimitive.ScrollAreaThumb className={scrollBarThumb} />
        </ScrollAreaPrimitive.ScrollAreaScrollbar>
    );
}

export {ScrollArea, ScrollBar};
