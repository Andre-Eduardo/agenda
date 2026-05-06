import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const statTileIconVariants = cva('flex items-center justify-center rounded-[8px]', {
  variants: {
    size: { sm: 'size-7', md: 'size-8', lg: 'size-10' },
    intent: {
      primary: 'bg-(--color-primary)/10 text-(--color-primary)',
      success: 'bg-(--color-success)/10 text-(--color-success)',
      warning: 'bg-(--color-warning)/10 text-(--color-warning)',
      danger:  'bg-(--color-danger)/10 text-(--color-danger)',
      info:    'bg-(--color-info-surface) text-(--color-info)',
      muted:   'bg-(--color-bg-surface) text-(--color-text-secondary)',
      ai:      'bg-(--color-ai-bg) text-(--color-ai-text)',
    },
  },
  defaultVariants: { size: 'md', intent: 'primary' },
});

export interface StatTileProps extends React.ComponentProps<'div'> {
  loading?: boolean;
  label: string;
  value: React.ReactNode;
  delta?: React.ReactNode;
  deltaIntent?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  iconIntent?: VariantProps<typeof statTileIconVariants>['intent'];
}

function StatTile({
  label,
  value,
  delta,
  deltaIntent = 'neutral',
  icon,
  iconIntent = 'primary',
  loading,
  className,
  ref,
  ...props
}: StatTileProps) {
  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-col gap-1.5 rounded-(--radius-card) border border-(--color-border) bg-(--color-bg-card) p-[18px]',
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm leading-[1.4] text-(--color-text-secondary)">{label}</span>
        {icon && (
          <span className={statTileIconVariants({ intent: iconIntent })}>{icon}</span>
        )}
      </div>
      {loading ? (
        <div className="mt-0.5 h-8 w-16 animate-pulse rounded bg-(--color-bg-surface)" />
      ) : (
        <div className="mt-0.5 font-mono text-[28px] font-medium leading-[1.1] tabular-nums tracking-[-0.01em] text-(--color-text-primary)">
          {value}
        </div>
      )}
      {delta !== undefined && (
        <div
          className={cn(
            'text-2xs leading-[1.4]',
            deltaIntent === 'positive' && 'text-(--color-success)',
            deltaIntent === 'negative' && 'text-(--color-danger)',
            deltaIntent === 'neutral' && 'text-(--color-text-tertiary)',
          )}
        >
          {delta}
        </div>
      )}
    </div>
  );
}

export { StatTile, statTileIconVariants };
