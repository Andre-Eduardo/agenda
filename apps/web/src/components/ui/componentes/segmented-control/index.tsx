import * as React from 'react';
import {clsx} from 'clsx';

import styles from './segmented-control.module.css';

// ── SegmentedControl ──────────────────────────────────────────────────────────
//
// Uso: valor controlado via value/onValueChange.

export interface SegmentedControlProps extends React.ComponentProps<'div'> {
  value:           string;
  onValueChange:   (value: string) => void;
}

function SegmentedControl({
  value,
  onValueChange,
  className,
  children,
  ref,
  ...props
}: SegmentedControlProps) {
  return (
    <div
      ref={ref}
      role="group"
      className={clsx(styles.root, className)}
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

// ── SegmentedControlItem ──────────────────────────────────────────────────────

export interface SegmentedControlItemProps extends React.ComponentProps<'button'> {
  value:      string;
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
      className={clsx(
        styles.item,
        _selected ? styles.itemSelected : styles.itemUnselected,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

SegmentedControl.Item = SegmentedControlItem;

export {SegmentedControl, SegmentedControlItem};
