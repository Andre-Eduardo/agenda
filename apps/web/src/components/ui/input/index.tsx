import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

export const inputVariants = cva(
  'w-full rounded-(--radius-input) border border-(--color-border) bg-(--color-bg-card) px-3 py-[9px] text-sm leading-[1.4] text-(--color-text-primary) transition-colors duration-(--duration-fast) ease-out placeholder:text-(--color-text-tertiary) hover:border-(--color-border-hover) focus:border-(--color-primary) focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium',
  {
    variants: {
      appearance: {
        default: '',
        mono: 'font-mono tabular-nums text-[13px]',
      },
      state: {
        default: '',
        error: 'border-(--color-warning) focus:border-(--color-warning)',
      },
    },
    defaultVariants: {
      appearance: 'default',
      state: 'default',
    },
  },
);

export interface InputProps
  extends React.ComponentProps<'input'>,
    VariantProps<typeof inputVariants> {
  leadIcon?: React.ReactNode;
  trailIcon?: React.ReactNode;
}

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
        inputVariants({ appearance, state }),
        leadIcon && 'pl-[36px]',
        trailIcon && 'pr-8',
        className,
      )}
      {...props}
    />
  );

  if (!leadIcon && !trailIcon) return inputEl;

  return (
    <div className="relative">
      {leadIcon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-tertiary)">
          {leadIcon}
        </span>
      )}
      {inputEl}
      {trailIcon && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-(--color-text-tertiary)">
          {trailIcon}
        </span>
      )}
    </div>
  );
}

export { Input };
