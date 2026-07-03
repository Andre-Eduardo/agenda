import * as SheetPrimitive from '@radix-ui/react-dialog';
import {X} from 'lucide-react';
import {cx, css} from '@/styled-system/css';
import {
    sheetCloseButton,
    sheetContent,
    sheetDescription,
    sheetFooter,
    sheetHeader,
    sheetOverlay,
    sheetSideBottom,
    sheetSideLeft,
    sheetSideRight,
    sheetSideTop,
    sheetTitle,
} from './styles';

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;

function SheetOverlay({className, ref, ...props}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
    return (
        <SheetPrimitive.Overlay
            ref={ref}
            className={cx(
                sheetOverlay,
                'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
                className
            )}
            {...props}
        />
    );
}

// ── Side variant map ──────────────────────────────────────────────────────────

const sideClass = {
    top: sheetSideTop,
    bottom: sheetSideBottom,
    left: sheetSideLeft,
    right: sheetSideRight,
} as const;

type SheetSide = keyof typeof sideClass;

interface SheetContentProps extends React.ComponentProps<typeof SheetPrimitive.Content> {
    side?: SheetSide;
}

function SheetContent({side = 'right', className, children, ref, ...props}: SheetContentProps) {
    const slideAnimationBySide: Record<SheetSide, string> = {
        top: 'data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top',
        bottom: 'data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
        left: 'data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left',
        right: 'data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
    };
    const slideAnimation = slideAnimationBySide[side];

    return (
        <SheetPortal>
            <SheetOverlay />
            <SheetPrimitive.Content
                ref={ref}
                className={cx(
                    sheetContent,
                    sideClass[side],
                    'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:duration-500 data-[state=closed]:duration-300',
                    slideAnimation,
                    className
                )}
                {...props}
            >
                {children}
                <SheetPrimitive.Close className={sheetCloseButton}>
                    <X className={css({w: '4', h: '4'})} />
                    <span className={css({srOnly: true})}>Close</span>
                </SheetPrimitive.Close>
            </SheetPrimitive.Content>
        </SheetPortal>
    );
}

function SheetHeader({className, ...props}: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cx(sheetHeader, className)} {...props} />;
}

SheetHeader.displayName = 'SheetHeader';

function SheetFooter({className, ...props}: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cx(sheetFooter, className)} {...props} />;
}

SheetFooter.displayName = 'SheetFooter';

function SheetTitle({className, ref, ...props}: React.ComponentProps<typeof SheetPrimitive.Title>) {
    return <SheetPrimitive.Title ref={ref} className={cx(sheetTitle, className)} {...props} />;
}

function SheetDescription({className, ref, ...props}: React.ComponentProps<typeof SheetPrimitive.Description>) {
    return <SheetPrimitive.Description ref={ref} className={cx(sheetDescription, className)} {...props} />;
}

export {
    Sheet,
    SheetPortal,
    SheetOverlay,
    SheetTrigger,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetFooter,
    SheetTitle,
    SheetDescription,
};
