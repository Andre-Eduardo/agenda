import {AlertCircle} from 'lucide-react';
import {clsx} from 'clsx';

import {cn} from '@/lib/utils';
import {Label} from '@/components/ui/componentes/label';
import styles from './field.module.css';

// Tailwind purgea apenas classes usadas no código-fonte;
// o mapa garante que col-span-1 ... col-span-12 estejam presentes.
const colSpanMap: Record<number, string> = {
  1: 'col-span-1',  2: 'col-span-2',  3: 'col-span-3',
  4: 'col-span-4',  5: 'col-span-5',  6: 'col-span-6',
  7: 'col-span-7',  8: 'col-span-8',  9: 'col-span-9',
  10: 'col-span-10', 11: 'col-span-11', 12: 'col-span-12',
};

export interface FieldProps {
  label?:    string;
  required?: boolean;
  optional?: boolean;
  hint?:     string;
  error?:    string;
  htmlFor?:  string;
  cols?:     1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  className?: string;
  children:  React.ReactNode;
}

function Field({
  label,
  required,
  optional,
  hint,
  error,
  htmlFor,
  cols,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn(styles.field, cols && colSpanMap[cols], className)}>
      {label && (
        <div className={styles.labelRow}>
          <Label htmlFor={htmlFor}>{label}</Label>
          {required && <span className={styles.requiredMark}>*</span>}
          {optional && <span className={styles.optionalText}>(opcional)</span>}
        </div>
      )}
      {children}
      {error && (
        <span className={styles.error}>
          <AlertCircle className="size-3 shrink-0" />
          {error}
        </span>
      )}
      {!error && hint && <span className={styles.hint}>{hint}</span>}
    </div>
  );
}

export interface FormGridProps extends React.ComponentProps<'div'> {
  cols?: 12 | 6 | 4 | 3;
}

const formGridColsClass = {
  12: styles.formGridCols12,
  6:  styles.formGridCols6,
  4:  styles.formGridCols4,
  3:  styles.formGridCols3,
} as const;

function FormGrid({cols = 12, className, ...props}: FormGridProps) {
  return (
    <div
      className={clsx(styles.formGrid, formGridColsClass[cols], className)}
      {...props}
    />
  );
}

export {Field, FormGrid};
