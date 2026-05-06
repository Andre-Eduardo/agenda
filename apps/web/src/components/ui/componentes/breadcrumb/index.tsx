import {Slot} from '@radix-ui/react-slot';
import {ChevronRight, MoreHorizontal} from 'lucide-react';
import {clsx} from 'clsx';

import styles from './breadcrumb.module.css';

function Breadcrumb({
  ref,
  ...props
}: React.ComponentProps<'nav'> & {separator?: React.ReactNode}) {
  return <nav ref={ref} aria-label="breadcrumb" {...props} />;
}

function BreadcrumbList({className, ref, ...props}: React.ComponentProps<'ol'>) {
  return <ol ref={ref} className={clsx(styles.list, className)} {...props} />;
}

function BreadcrumbItem({className, ref, ...props}: React.ComponentProps<'li'>) {
  return <li ref={ref} className={clsx(styles.item, className)} {...props} />;
}

function BreadcrumbLink({
  asChild,
  className,
  ref,
  ...props
}: React.ComponentProps<'a'> & {asChild?: boolean}) {
  const Comp = asChild ? Slot : 'a';
  return <Comp ref={ref} className={clsx(styles.link, className)} {...props} />;
}

function BreadcrumbPage({className, ref, ...props}: React.ComponentProps<'span'>) {
  return (
    <span
      ref={ref}
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={clsx(styles.page, className)}
      {...props}
    />
  );
}

function BreadcrumbSeparator({children, className, ...props}: React.ComponentProps<'li'>) {
  return (
    <li
      role="presentation"
      aria-hidden="true"
      className={clsx(styles.separator, className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  );
}

function BreadcrumbEllipsis({className, ...props}: React.ComponentProps<'span'>) {
  return (
    <span
      role="presentation"
      aria-hidden="true"
      className={clsx(styles.ellipsis, className)}
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
