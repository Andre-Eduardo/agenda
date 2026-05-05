import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

const colSpanMap: Record<number, string> = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
  7: 'col-span-7',
  8: 'col-span-8',
  9: 'col-span-9',
  10: 'col-span-10',
  11: 'col-span-11',
  12: 'col-span-12',
};

export interface FieldProps {
  label?: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string;
  htmlFor?: string;
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  className?: string;
  children: React.ReactNode;
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
    <div className={cn('flex flex-col gap-1.5', cols && colSpanMap[cols], className)}>
      {label && (
        <div className="flex items-center gap-1">
          <Label htmlFor={htmlFor}>{label}</Label>
          {required && <span className="text-(--color-danger)">*</span>}
          {optional && (
            <span className="text-xs font-normal text-(--color-text-tertiary)">(opcional)</span>
          )}
        </div>
      )}
      {children}
      {error && (
        <span className="flex items-center gap-1 text-xs leading-[1.4] text-(--color-warning)">
          <AlertCircle className="size-3 shrink-0" />
          {error}
        </span>
      )}
      {!error && hint && (
        <span className="text-xs leading-[1.4] text-(--color-text-tertiary)">{hint}</span>
      )}
    </div>
  );
}

export interface FormGridProps extends React.ComponentProps<'div'> {
  cols?: 12 | 6 | 4 | 3;
}

function FormGrid({ cols = 12, className, ...props }: FormGridProps) {
  const colsClass = cols === 6 ? 'grid-cols-6' : cols === 4 ? 'grid-cols-4' : cols === 3 ? 'grid-cols-3' : 'grid-cols-12';
  return (
    <div
      className={cn('grid gap-x-4 gap-y-[14px]', colsClass, className)}
      {...props}
    />
  );
}

export { Field, FormGrid };
