'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import {X} from 'lucide-react';
import {cx, css} from '@/styled-system/css';
import {
    dialogCloseButton,
    dialogContent,
    dialogDescription,
    dialogFooter,
    dialogHeader,
    dialogOverlay,
    dialogTitle,
} from './styles';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

function DialogOverlay({className, ref, ...props}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
    return (
        <DialogPrimitive.Overlay
            ref={ref}
            className={cx(
                dialogOverlay,
                'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
                className
            )}
            {...props}
        />
    );
}

function DialogContent({className, children, ref, ...props}: React.ComponentProps<typeof DialogPrimitive.Content>) {
    return (
        <DialogPortal>
            <DialogOverlay />
            <DialogPrimitive.Content
                ref={ref}
                className={cx(
                    dialogContent,
                    'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
                    className
                )}
                {...props}
            >
                {children}
                <DialogPrimitive.Close className={dialogCloseButton}>
                    <X className={css({w: '4', h: '4'})} />
                    <span className={css({srOnly: true})}>Close</span>
                </DialogPrimitive.Close>
            </DialogPrimitive.Content>
        </DialogPortal>
    );
}

function DialogHeader({className, ...props}: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cx(dialogHeader, className)} {...props} />;
}

DialogHeader.displayName = 'DialogHeader';

function DialogFooter({className, ...props}: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cx(dialogFooter, className)} {...props} />;
}

DialogFooter.displayName = 'DialogFooter';

function DialogTitle({className, ref, ...props}: React.ComponentProps<typeof DialogPrimitive.Title>) {
    return <DialogPrimitive.Title ref={ref} className={cx(dialogTitle, className)} {...props} />;
}

function DialogDescription({className, ref, ...props}: React.ComponentProps<typeof DialogPrimitive.Description>) {
    return <DialogPrimitive.Description ref={ref} className={cx(dialogDescription, className)} {...props} />;
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
