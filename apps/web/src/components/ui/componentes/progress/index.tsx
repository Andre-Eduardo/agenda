'use client';

import * as ProgressPrimitive from '@radix-ui/react-progress';
import {clsx} from 'clsx';

import styles from './progress.module.css';

function Progress({
  className,
  value,
  ref,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={clsx(styles.progressRoot, className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={styles.progressIndicator}
        style={{transform: `translateX(-${100 - (value || 0)}%)`}}
      />
    </ProgressPrimitive.Root>
  );
}

export {Progress};
