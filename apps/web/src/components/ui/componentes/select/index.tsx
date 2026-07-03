import * as SelectPrimitive from '@radix-ui/react-select';
import {Check, ChevronDown, ChevronUp} from 'lucide-react';
import {cx, css} from '@/styled-system/css';
import {
    selectContent,
    selectContentPopper,
    selectItem,
    selectItemIndicator,
    selectLabel,
    selectScrollButton,
    selectSeparator,
    selectTrigger,
    selectViewport,
    selectViewportPopper,
} from './styles';

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

function SelectTrigger({className, children, ref, ...props}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
    return (
        <SelectPrimitive.Trigger ref={ref} className={cx(selectTrigger, className)} {...props}>
            {children}
            <SelectPrimitive.Icon asChild>
                <ChevronDown className={css({w: '4', h: '4', opacity: '0.5'})} />
            </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
    );
}

function SelectScrollUpButton({className, ref, ...props}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
    return (
        <SelectPrimitive.ScrollUpButton ref={ref} className={cx(selectScrollButton, className)} {...props}>
            <ChevronUp className={css({w: '4', h: '4'})} />
        </SelectPrimitive.ScrollUpButton>
    );
}

function SelectScrollDownButton({
    className,
    ref,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
    return (
        <SelectPrimitive.ScrollDownButton ref={ref} className={cx(selectScrollButton, className)} {...props}>
            <ChevronDown className={css({w: '4', h: '4'})} />
        </SelectPrimitive.ScrollDownButton>
    );
}

function SelectContent({
    className,
    children,
    position = 'popper',
    ref,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
    return (
        <SelectPrimitive.Portal>
            <SelectPrimitive.Content
                ref={ref}
                className={cx(
                    selectContent,
                    position === 'popper' && selectContentPopper,
                    'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                    className
                )}
                position={position}
                {...props}
            >
                <SelectScrollUpButton />
                <SelectPrimitive.Viewport className={cx(selectViewport, position === 'popper' && selectViewportPopper)}>
                    {children}
                </SelectPrimitive.Viewport>
                <SelectScrollDownButton />
            </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
    );
}

function SelectLabel({className, ref, ...props}: React.ComponentProps<typeof SelectPrimitive.Label>) {
    return <SelectPrimitive.Label ref={ref} className={cx(selectLabel, className)} {...props} />;
}

function SelectItem({className, children, ref, ...props}: React.ComponentProps<typeof SelectPrimitive.Item>) {
    return (
        <SelectPrimitive.Item ref={ref} className={cx(selectItem, className)} {...props}>
            <span className={selectItemIndicator}>
                <SelectPrimitive.ItemIndicator>
                    <Check className={css({w: '4', h: '4'})} />
                </SelectPrimitive.ItemIndicator>
            </span>
            <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        </SelectPrimitive.Item>
    );
}

function SelectSeparator({className, ref, ...props}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
    return <SelectPrimitive.Separator ref={ref} className={cx(selectSeparator, className)} {...props} />;
}

export {
    Select,
    SelectGroup,
    SelectValue,
    SelectTrigger,
    SelectContent,
    SelectLabel,
    SelectItem,
    SelectSeparator,
    SelectScrollUpButton,
    SelectScrollDownButton,
};
