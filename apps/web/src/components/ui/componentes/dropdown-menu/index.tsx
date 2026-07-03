'use client';

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import {Check, ChevronRight, Circle} from 'lucide-react';
import {cx, css} from '@/styled-system/css';
import {
    menuCheckItem,
    menuContent,
    menuItem,
    menuItemIndicator,
    menuItemInset,
    menuLabel,
    menuLabelInset,
    menuSeparator,
    menuShortcut,
} from './styles';

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

function DropdownMenuSubTrigger({
    className,
    inset,
    children,
    ref,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {inset?: boolean}) {
    return (
        <DropdownMenuPrimitive.SubTrigger
            ref={ref}
            className={cx(menuItem, inset && menuItemInset, className)}
            {...props}
        >
            {children}
            <ChevronRight className={css({ml: 'auto', w: '4', h: '4'})} />
        </DropdownMenuPrimitive.SubTrigger>
    );
}

function DropdownMenuSubContent({
    className,
    ref,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
    return (
        <DropdownMenuPrimitive.SubContent
            ref={ref}
            className={cx(
                menuContent,
                'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                className
            )}
            {...props}
        />
    );
}

function DropdownMenuContent({
    className,
    sideOffset = 4,
    ref,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
    return (
        <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content
                ref={ref}
                sideOffset={sideOffset}
                className={cx(
                    menuContent,
                    'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                    className
                )}
                {...props}
            />
        </DropdownMenuPrimitive.Portal>
    );
}

function DropdownMenuItem({
    className,
    inset,
    ref,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {inset?: boolean}) {
    return (
        <DropdownMenuPrimitive.Item ref={ref} className={cx(menuItem, inset && menuItemInset, className)} {...props} />
    );
}

function DropdownMenuCheckboxItem({
    className,
    children,
    checked,
    ref,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
    return (
        <DropdownMenuPrimitive.CheckboxItem
            ref={ref}
            className={cx(menuCheckItem, className)}
            checked={checked}
            {...props}
        >
            <span className={menuItemIndicator}>
                <DropdownMenuPrimitive.ItemIndicator>
                    <Check className={css({w: '4', h: '4'})} />
                </DropdownMenuPrimitive.ItemIndicator>
            </span>
            {children}
        </DropdownMenuPrimitive.CheckboxItem>
    );
}

function DropdownMenuRadioItem({
    className,
    children,
    ref,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
    return (
        <DropdownMenuPrimitive.RadioItem ref={ref} className={cx(menuCheckItem, className)} {...props}>
            <span className={menuItemIndicator}>
                <DropdownMenuPrimitive.ItemIndicator>
                    <Circle className={css({w: '2', h: '2', fill: 'currentColor'})} />
                </DropdownMenuPrimitive.ItemIndicator>
            </span>
            {children}
        </DropdownMenuPrimitive.RadioItem>
    );
}

function DropdownMenuLabel({
    className,
    inset,
    ref,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {inset?: boolean}) {
    return (
        <DropdownMenuPrimitive.Label
            ref={ref}
            className={cx(menuLabel, inset && menuLabelInset, className)}
            {...props}
        />
    );
}

function DropdownMenuSeparator({
    className,
    ref,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
    return <DropdownMenuPrimitive.Separator ref={ref} className={cx(menuSeparator, className)} {...props} />;
}

function DropdownMenuShortcut({className, ...props}: React.HTMLAttributes<HTMLSpanElement>) {
    return <span className={cx(menuShortcut, className)} {...props} />;
}

DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

export {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuGroup,
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuRadioGroup,
};
