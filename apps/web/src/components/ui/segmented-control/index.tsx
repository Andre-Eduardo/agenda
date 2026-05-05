import * as React from 'react';

import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// SegmentedControl — substitui o padrão segmented/segmentedBtn dos módulos.
// Uso: valor controlado via value/onValueChange.
// ---------------------------------------------------------------------------

export interface SegmentedControlProps extends React.ComponentProps<'div'> {
  value: string;
  onValueChange: (value: string) => void;
}

function SegmentedControl({ value, onValueChange, className, children, ref, ...props }: SegmentedControlProps) {
  return (
    <div
      ref={ref}
      role="group"
      className={cn(
        'inline-flex items-center gap-px rounded-(--radius-input) border border-(--color-border) bg-(--color-bg-surface) p-[3px]',
        className,
      )}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child as React.ReactElement<SegmentedControlItemProps>, {
          _selected: (child.props as SegmentedControlItemProps).value === value,
          _onSelect: onValueChange,
        });
      })}
    </div>
  );
}

export interface SegmentedControlItemProps extends React.ComponentProps<'button'> {
  value: string;
  /** @internal injetado pelo SegmentedControl pai */
  _selected?: boolean;
  /** @internal injetado pelo SegmentedControl pai */
  _onSelect?: (value: string) => void;
}

function SegmentedControlItem({
  value,
  _selected,
  _onSelect,
  className,
  children,
  ref,
  ...props
}: SegmentedControlItemProps) {
  return (
    <button
      ref={ref}
      type="button"
      role="radio"
      aria-checked={_selected}
      onClick={() => _onSelect?.(value)}
      className={cn(
        'inline-flex h-[26px] cursor-pointer select-none items-center gap-1.5 rounded-[4px] px-2.5 text-xs font-medium transition-colors duration-(--duration-fast)',
        _selected
          ? 'bg-(--color-bg-card) text-(--color-text-primary) shadow-sm'
          : 'text-(--color-text-secondary) hover:text-(--color-text-primary)',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

SegmentedControl.Item = SegmentedControlItem;

export { SegmentedControl, SegmentedControlItem };
