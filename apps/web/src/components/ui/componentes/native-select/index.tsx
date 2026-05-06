import { cn } from '@/lib/utils';
import { type VariantProps } from 'class-variance-authority';
import { inputVariants } from '@/components/ui/componentes/input';

export interface NativeSelectProps
  extends React.ComponentProps<'select'>,
    VariantProps<typeof inputVariants> {}

function NativeSelect({ className, appearance, state, ref, ...props }: NativeSelectProps) {
  return (
    <select
      ref={ref}
      className={cn(
        inputVariants({ appearance, state }),
        'appearance-none',
        "bg-[url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")] bg-no-repeat bg-[right_10px_center] pr-8",
        className,
      )}
      {...props}
    />
  );
}

export { NativeSelect };
