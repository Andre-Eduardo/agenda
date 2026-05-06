import { cn } from '@/lib/utils';

export interface EmptyStateProps extends React.ComponentProps<'div'> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ref,
  ...props
}: EmptyStateProps) {
  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-col items-center gap-3 py-16 text-center',
        className,
      )}
      {...props}
    >
      {icon && (
        <span className="flex size-14 items-center justify-center rounded-full bg-(--color-bg-surface) text-(--color-text-tertiary)">
          {icon}
        </span>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-(--color-text-primary)">{title}</p>
        {description && (
          <p className="text-sm text-(--color-text-secondary)">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

// Wrapper com borda de card — uso mais comum em listas
function EmptyStateCard({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof EmptyState>) {
  return (
    <div className={cn(
      'rounded-(--radius-card) border border-(--color-border) bg-(--color-bg-card)',
      className,
    )}>
      <EmptyState ref={ref} {...props} />
    </div>
  );
}

export { EmptyState, EmptyStateCard };
