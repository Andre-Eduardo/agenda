import {type DialogProps} from '@radix-ui/react-dialog';
import {Command as CommandPrimitive} from 'cmdk';
import {Search} from 'lucide-react';
import {clsx} from 'clsx';

import {Dialog, DialogContent} from '@/components/ui/componentes/dialog';
import styles from './command.module.css';

function Command({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      ref={ref}
      className={clsx(styles.command, className)}
      {...props}
    />
  );
}

const CommandDialog = ({children, ...props}: DialogProps) => (
  <Dialog {...props}>
    <DialogContent className="overflow-hidden p-0 shadow-lg">
      <Command className={styles.commandDialog}>{children}</Command>
    </DialogContent>
  </Dialog>
);

function CommandInput({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div className={styles.commandInputWrapper} cmdk-input-wrapper="">
      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      <CommandPrimitive.Input
        ref={ref}
        className={clsx(styles.commandInput, className)}
        {...props}
      />
    </div>
  );
}

function CommandList({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      ref={ref}
      className={clsx(styles.commandList, className)}
      {...props}
    />
  );
}

function CommandEmpty({
  ref,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      ref={ref}
      className={styles.commandEmpty}
      {...props}
    />
  );
}

function CommandGroup({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      ref={ref}
      className={clsx(styles.commandGroup, className)}
      {...props}
    />
  );
}

function CommandSeparator({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      ref={ref}
      className={clsx(styles.commandSeparator, className)}
      {...props}
    />
  );
}

function CommandItem({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      ref={ref}
      className={clsx(styles.commandItem, className)}
      {...props}
    />
  );
}

function CommandShortcut({className, ...props}: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={clsx(styles.commandShortcut, className)} {...props} />;
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
