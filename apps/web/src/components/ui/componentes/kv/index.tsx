import {clsx} from 'clsx';

import styles from './kv.module.css';

export interface KVProps extends React.ComponentProps<'div'> {
  label:      string;
  value?:     React.ReactNode;
  mono?:      boolean;
  emptyText?: string;
}

function KV({label, value, mono, emptyText = '—', className, ref, ...props}: KVProps) {
  const isEmpty = value === null || value === undefined || value === '';
  return (
    <div ref={ref} className={clsx(styles.root, className)} {...props}>
      <dt className={styles.label}>{label}</dt>
      <dd
        className={clsx(
          styles.value,
          mono    && styles.valueMono,
          isEmpty && styles.valueEmpty,
        )}
      >
        {isEmpty ? emptyText : value}
      </dd>
    </div>
  );
}

// Grade de KV — substitui kvGrid nos módulos

const colsClass = {
  2: styles.gridCols2,
  3: styles.gridCols3,
  4: styles.gridCols4,
} as const;

function KVGrid({
  cols = 2,
  className,
  ref,
  ...props
}: React.ComponentProps<'dl'> & {cols?: 2 | 3 | 4}) {
  return (
    <dl
      ref={ref}
      className={clsx(styles.grid, colsClass[cols], className)}
      {...props}
    />
  );
}

export {KV, KVGrid};
