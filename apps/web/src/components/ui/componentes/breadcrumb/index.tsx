import {Slot} from '@radix-ui/react-slot';
import {ChevronRight, MoreHorizontal} from 'lucide-react';
import {css, cx} from '@/styled-system/css';
import {ellipsis, ellipsisIcon, item, link, list, page, separator} from './styles';

function Breadcrumb({ref, ...props}: React.ComponentProps<'nav'> & {separator?: React.ReactNode}) {
    return <nav ref={ref} aria-label="breadcrumb" {...props} />;
}

function BreadcrumbList({className, ref, ...props}: React.ComponentProps<'ol'>) {
    return <ol ref={ref} className={cx(list, className)} {...props} />;
}

function BreadcrumbItem({className, ref, ...props}: React.ComponentProps<'li'>) {
    return <li ref={ref} className={cx(item, className)} {...props} />;
}

function BreadcrumbLink({asChild, className, ref, ...props}: React.ComponentProps<'a'> & {asChild?: boolean}) {
    const Comp = asChild ? Slot : 'a';
    return <Comp ref={ref} className={cx(link, className)} {...props} />;
}

function BreadcrumbPage({className, ref, ...props}: React.ComponentProps<'span'>) {
    return (
        <span
            ref={ref}
            role="link"
            aria-disabled="true"
            aria-current="page"
            className={cx(page, className)}
            {...props}
        />
    );
}

function BreadcrumbSeparator({children, className, ...props}: React.ComponentProps<'li'>) {
    return (
        <li role="presentation" aria-hidden="true" className={cx(separator, className)} {...props}>
            {children ?? <ChevronRight />}
        </li>
    );
}

function BreadcrumbEllipsis({className, ...props}: React.ComponentProps<'span'>) {
    return (
        <span role="presentation" aria-hidden="true" className={cx(ellipsis, className)} {...props}>
            <MoreHorizontal className={ellipsisIcon} />
            <span className={css({srOnly: true})}>More</span>
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
