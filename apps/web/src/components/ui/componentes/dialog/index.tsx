'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import {clsx} from 'clsx';
import {X} from 'lucide-react';
import styles from './dialog.module.css';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

function DialogOverlay({className, ref, ...props}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
    return <DialogPrimitive.Overlay ref={ref} className={clsx(styles.dialogOverlay, className)} {...props} />;
}

function DialogContent({className, children, ref, ...props}: React.ComponentProps<typeof DialogPrimitive.Content>) {
    return (
        <DialogPortal>
            <DialogOverlay />
            <DialogPrimitive.Content ref={ref} className={clsx(styles.dialogContent, className)} {...props}>
                {children}
                <DialogPrimitive.Close className={styles.dialogCloseButton}>
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </DialogPrimitive.Close>
            </DialogPrimitive.Content>
        </DialogPortal>
    );
}

function DialogHeader({className, ...props}: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={clsx(styles.dialogHeader, className)} {...props} />;
}
DialogHeader.displayName = 'DialogHeader';

function DialogFooter({className, ...props}: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={clsx(styles.dialogFooter, className)} {...props} />;
}
DialogFooter.displayName = 'DialogFooter';

function DialogTitle({className, ref, ...props}: React.ComponentProps<typeof DialogPrimitive.Title>) {
    return <DialogPrimitive.Title ref={ref} className={clsx(styles.dialogTitle, className)} {...props} />;
}

function DialogDescription({className, ref, ...props}: React.ComponentProps<typeof DialogPrimitive.Description>) {
    return <DialogPrimitive.Description ref={ref} className={clsx(styles.dialogDescription, className)} {...props} />;
}

export {
    Dialog,
    DialogPortal,
    DialogOverlay,
    DialogClose,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
};
