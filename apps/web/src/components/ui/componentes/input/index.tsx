import {cva, type VariantProps} from 'class-variance-authority';

import {cn} from '@/lib/utils';
import styles from './input.module.css';

// ── Variantes ─────────────────────────────────────────────────────────────────

export const inputVariants = cva(styles.base, {
  variants: {
    appearance: {
      default: '',
      mono:    styles.appearanceMono,
    },
    state: {
      default: '',
      error:   styles.stateError,
    },
  },
  defaultVariants: {
    appearance: 'default',
    state: 'default',
  },
});

// ── Props ─────────────────────────────────────────────────────────────────────

export interface InputProps
  extends React.ComponentProps<'input'>,
    VariantProps<typeof inputVariants> {
  leadIcon?:  React.ReactNode;
  trailIcon?: React.ReactNode;
}

// ── Componente ────────────────────────────────────────────────────────────────

function Input({
  className,
  type,
  appearance,
  state,
  leadIcon,
  trailIcon,
  ref,
  ...props
}: InputProps) {
  const inputEl = (
    <input
      type={type}
      ref={ref}
      className={cn(
        inputVariants({appearance, state}),
        leadIcon  && styles.withLeadIcon,
        trailIcon && styles.withTrailIcon,
        className,
      )}
      {...props}
    />
  );

  if (!leadIcon && !trailIcon) return inputEl;

  return (
    <div className={styles.wrapper}>
      {leadIcon  && <span className={styles.leadIcon}>{leadIcon}</span>}
      {inputEl}
      {trailIcon && <span className={styles.trailIcon}>{trailIcon}</span>}
    </div>
  );
}

export {Input};
