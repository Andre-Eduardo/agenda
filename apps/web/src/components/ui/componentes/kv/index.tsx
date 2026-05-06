import { cn } from '@/lib/utils';

export interface KVProps extends React.ComponentProps<'div'> {
  label: string;
  value?: React.ReactNode;
  mono?: boolean;
  emptyText?: string;
}

function KV({ label, value, mono, emptyText = '—', className, ref, ...props }: KVProps) {
  const isEmpty = value === null || value === undefined || value === '';
  return (
    <div ref={ref} className={cn('flex min-w-0 flex-col gap-[2px]', className)} {...props}>
      <dt className="text-[12px] leading-[1.3] text-(--color-text-tertiary)">{label}</dt>
      <dd
        className={cn(
          'break-words text-[13px] leading-[1.4] text-(--color-text-primary)',
          mono && 'font-mono tabular-nums',
          isEmpty && 'italic text-(--color-text-tertiary)',
        )}
      >
        {isEmpty ? emptyText : value}
      </dd>
    </div>
  );
}

// Grade de KV — substitui kvGrid nos módulos
function KVGrid({ cols = 2, className, ref, ...props }: React.ComponentProps<'dl'> & { cols?: 2 | 3 | 4 }) {
  return (
    <dl
      ref={ref}
      className={cn(
        'grid gap-x-6 gap-y-4',
        cols === 2 && 'grid-cols-2',
        cols === 3 && 'grid-cols-3',
        cols === 4 && 'grid-cols-4',
        className,
      )}
      {...props}
    />
  );
}

export { KV, KVGrid };
