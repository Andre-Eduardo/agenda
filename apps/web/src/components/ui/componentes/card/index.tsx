import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';;

function Card({ className, ref, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-(--radius-card) border border-(--color-border) bg-(--color-bg-card)',
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ref, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      ref={ref}
      className={cn('flex flex-col gap-1.5 px-[18px] py-[14px]', className)}
      {...props}
    />
  );
}

function CardTitle({ className, ref, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      ref={ref}
      className={cn('text-sm font-medium text-(--color-text-primary)', className)}
      {...props}
    />
  );
}

function CardDescription({ className, ref, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      ref={ref}
      className={cn('text-xs text-(--color-text-secondary)', className)}
      {...props}
    />
  );
}

function CardContent({ className, ref, ...props }: React.ComponentProps<'div'>) {
  return <div ref={ref} className={cn('p-[18px]', className)} {...props} />;
}

function CardFooter({ className, ref, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      ref={ref}
      className={cn('flex items-center border-t border-(--color-border) px-[18px] py-[14px]', className)}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// SectionCard — card com header bordado + body, substitui o padrão sectionCard
// dos módulos. Suporta appearance "default" (padding normal), "flush" e "sm".
// ---------------------------------------------------------------------------

const sectionCardBodyVariants = cva('', {
  variants: {
    appearance: {
      default: 'p-[18px]',
      flush:   'p-0',
      sm:      'p-3',
    },
  },
  defaultVariants: { appearance: 'default' },
});

function SectionCard({ className, ref, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      ref={ref}
      className={cn(
        'overflow-hidden rounded-(--radius-card) border border-(--color-border) bg-(--color-bg-card)',
        className,
      )}
      {...props}
    />
  );
}

function SectionCardHeader({
  className,
  action,
  ref,
  children,
  ...props
}: React.ComponentProps<'div'> & { action?: React.ReactNode }) {
  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-between border-b border-(--color-border) px-[18px] py-[14px]',
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2">{children}</div>
      {action && <div className="flex items-center gap-1">{action}</div>}
    </div>
  );
}

function SectionCardTitle({ className, ref, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      ref={ref}
      className={cn('text-sm font-medium text-(--color-text-primary)', className)}
      {...props}
    />
  );
}

function SectionCardBody({
  className,
  appearance,
  ref,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof sectionCardBodyVariants>) {
  return (
    <div
      ref={ref}
      className={cn(sectionCardBodyVariants({ appearance }), className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  SectionCard,
  SectionCardHeader,
  SectionCardTitle,
  SectionCardBody,
};
