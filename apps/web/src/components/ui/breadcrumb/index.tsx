import { Slot } from '@radix-ui/react-slot';
import { ChevronRight, MoreHorizontal } from 'lucide-react';

import { cn } from '@/lib/utils';

function Breadcrumb({
  ref,
  ...props
}: React.ComponentProps<'nav'> & { separator?: React.ReactNode }) {
  return <nav ref={ref} aria-label="breadcrumb" {...props} />;
}

function BreadcrumbList({ className, ref, ...props }: React.ComponentProps<'ol'>) {
  return (
    <ol
      ref={ref}
      className={cn(
        'flex flex-wrap items-center gap-[6px] text-[13px] text-(--color-text-tertiary)',
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbItem({ className, ref, ...props }: React.ComponentProps<'li'>) {
  return (
    <li ref={ref} className={cn('inline-flex items-center gap-[6px]', className)} {...props} />
  );
}

function BreadcrumbLink({
  asChild,
  className,
  ref,
  ...props
}: React.ComponentProps<'a'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'a';
  return (
    <Comp
      ref={ref}
      className={cn(
        'cursor-pointer text-(--color-text-secondary) transition-colors hover:text-(--color-primary-text)',
        className,
      )}
      {...props}
    />
  );
}

function BreadcrumbPage({ className, ref, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      ref={ref}
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn('text-(--color-text-primary)', className)}
      {...props}
    />
  );
}

function BreadcrumbSeparator({ children, className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      role="presentation"
      aria-hidden="true"
      className={cn('text-(--color-text-tertiary) [&>svg]:size-3', className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  );
}

function BreadcrumbEllipsis({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      role="presentation"
      aria-hidden="true"
      className={cn('flex size-7 items-center justify-center', className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More</span>
    </span>
  );
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
