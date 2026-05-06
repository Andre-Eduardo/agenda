import * as SheetPrimitive from '@radix-ui/react-dialog';
import {type VariantProps} from 'class-variance-authority';
import {clsx} from 'clsx';
import {X} from 'lucide-react';
import styles from './sheet.module.css';

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;

function SheetOverlay({className, ref, ...props}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
    return <SheetPrimitive.Overlay ref={ref} className={clsx(styles.sheetOverlay, className)} {...props} />;
}

// ── Side variant map ──────────────────────────────────────────────────────────

const sideClass = {
    top: styles.sheetSideTop,
    bottom: styles.sheetSideBottom,
    left: styles.sheetSideLeft,
    right: styles.sheetSideRight,
} as const;

type SheetSide = keyof typeof sideClass;

interface SheetContentProps extends React.ComponentProps<typeof SheetPrimitive.Content> {
    side?: SheetSide;
}

function SheetContent({side = 'right', className, children, ref, ...props}: SheetContentProps) {
    return (
        <SheetPortal>
            <SheetOverlay />
            <SheetPrimitive.Content
                ref={ref}
                className={clsx(styles.sheetContent, sideClass[side], className)}
                {...props}
            >
                {children}
                <SheetPrimitive.Close className={styles.sheetCloseButton}>
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </SheetPrimitive.Close>
            </SheetPrimitive.Content>
        </SheetPortal>
    );
}

function SheetHeader({className, ...props}: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={clsx(styles.sheetHeader, className)} {...props} />;
}
SheetHeader.displayName = 'SheetHeader';

function SheetFooter({className, ...props}: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={clsx(styles.sheetFooter, className)} {...props} />;
}
SheetFooter.displayName = 'SheetFooter';

function SheetTitle({className, ref, ...props}: React.ComponentProps<typeof SheetPrimitive.Title>) {
    return <SheetPrimitive.Title ref={ref} className={clsx(styles.sheetTitle, className)} {...props} />;
}

function SheetDescription({className, ref, ...props}: React.ComponentProps<typeof SheetPrimitive.Description>) {
    return <SheetPrimitive.Description ref={ref} className={clsx(styles.sheetDescription, className)} {...props} />;
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
