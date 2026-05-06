import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// PageHeader — cabeçalho padrão de página com título, subtítulo e ações.
// Substitui o padrão pageHeader dos módulos.
// ---------------------------------------------------------------------------

export interface PageHeaderProps extends React.ComponentProps<'div'> {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
}

function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumb,
  className,
  ref,
  ...props
}: PageHeaderProps) {
  return (
    <div ref={ref} className={cn('flex flex-col gap-1', className)} {...props}>
      {breadcrumb && <div>{breadcrumb}</div>}
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[32px] font-medium leading-[1.15] tracking-[-0.01em] text-(--color-text-primary)">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm leading-[1.5] text-(--color-text-secondary)">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

// Variante para detail pages — card sticky com avatar + nome + meta + ações
export interface EntityHeaderProps extends React.ComponentProps<'div'> {
  avatar?: React.ReactNode;
  name: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  alerts?: React.ReactNode;
  sticky?: boolean;
}

function EntityHeader({
  avatar,
  name,
  meta,
  actions,
  alerts,
  sticky = true,
  className,
  ref,
  ...props
}: EntityHeaderProps) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-(--radius-card) border border-(--color-border) bg-(--color-bg-card) px-5 py-[18px]',
        sticky && 'sticky top-0 z-10',
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-[18px]">
        <div className="flex min-w-0 items-center gap-[18px]">
          {avatar}
          <div className="min-w-0">
            <div className="text-[26px] font-medium leading-[1.2] text-(--color-text-primary)">
              {name}
            </div>
            {meta && (
              <div className="mt-[6px] flex flex-wrap items-center gap-2 text-[13px] text-(--color-text-secondary)">
                {meta}
              </div>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
      {alerts && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-(--color-border) pt-3">
          {alerts}
        </div>
      )}
    </div>
  );
}

export { PageHeader, EntityHeader };
