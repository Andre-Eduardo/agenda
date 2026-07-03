import type {DialogProps} from '@radix-ui/react-dialog';
import {Command as CommandPrimitive} from 'cmdk';
import {Search} from 'lucide-react';
import {Dialog, DialogContent} from '@/components/ui/componentes/dialog';
import {cx, css} from '@/styled-system/css';
import {
    command,
    commandDialog,
    commandEmpty,
    commandGroup,
    commandInput,
    commandInputWrapper,
    commandItem,
    commandList,
    commandSeparator,
    commandShortcut,
} from './styles';

function Command({className, ref, ...props}: React.ComponentProps<typeof CommandPrimitive>) {
    return <CommandPrimitive ref={ref} className={cx(command, className)} {...props} />;
}

const CommandDialog = ({children, ...props}: DialogProps) => (
    <Dialog {...props}>
        <DialogContent className={css({overflow: 'hidden', p: '0', boxShadow: 'lg'})}>
            <Command className={commandDialog}>{children}</Command>
        </DialogContent>
    </Dialog>
);

function CommandInput({className, ref, ...props}: React.ComponentProps<typeof CommandPrimitive.Input>) {
    return (
        // eslint-disable-next-line react/no-unknown-property -- cmdk marker attribute used by styles
        <div className={commandInputWrapper} cmdk-input-wrapper="">
            <Search className={css({mr: '2', w: '4', h: '4', flexShrink: '0', opacity: '0.5'})} />
            <CommandPrimitive.Input ref={ref} className={cx(commandInput, className)} {...props} />
        </div>
    );
}

function CommandList({className, ref, ...props}: React.ComponentProps<typeof CommandPrimitive.List>) {
    return <CommandPrimitive.List ref={ref} className={cx(commandList, className)} {...props} />;
}

function CommandEmpty({ref, ...props}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
    return <CommandPrimitive.Empty ref={ref} className={commandEmpty} {...props} />;
}

function CommandGroup({className, ref, ...props}: React.ComponentProps<typeof CommandPrimitive.Group>) {
    return <CommandPrimitive.Group ref={ref} className={cx(commandGroup, className)} {...props} />;
}

function CommandSeparator({className, ref, ...props}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
    return <CommandPrimitive.Separator ref={ref} className={cx(commandSeparator, className)} {...props} />;
}

function CommandItem({className, ref, ...props}: React.ComponentProps<typeof CommandPrimitive.Item>) {
    return <CommandPrimitive.Item ref={ref} className={cx(commandItem, className)} {...props} />;
}

function CommandShortcut({className, ...props}: React.HTMLAttributes<HTMLSpanElement>) {
    return <span className={cx(commandShortcut, className)} {...props} />;
}

CommandShortcut.displayName = 'CommandShortcut';

export {
    Command,
    CommandDialog,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandShortcut,
    CommandSeparator,
};
