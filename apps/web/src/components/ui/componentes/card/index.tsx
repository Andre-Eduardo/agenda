import {cva, type VariantProps} from 'class-variance-authority';
import {clsx} from 'clsx';
import {cn} from '@/lib/utils';
import styles from './card.module.css';

// ── Card ──────────────────────────────────────────────────────────────────────

function Card({className, ref, ...props}: React.ComponentProps<'div'>) {
    return <div ref={ref} className={clsx(styles.card, className)} {...props} />;
}

function CardHeader({className, ref, ...props}: React.ComponentProps<'div'>) {
    return <div ref={ref} className={clsx(styles.cardHeader, className)} {...props} />;
}

function CardTitle({className, ref, ...props}: React.ComponentProps<'div'>) {
    return <div ref={ref} className={clsx(styles.cardTitle, className)} {...props} />;
}

function CardDescription({className, ref, ...props}: React.ComponentProps<'div'>) {
    return <div ref={ref} className={clsx(styles.cardDescription, className)} {...props} />;
}

function CardContent({className, ref, ...props}: React.ComponentProps<'div'>) {
    return <div ref={ref} className={clsx(styles.cardContent, className)} {...props} />;
}

function CardFooter({className, ref, ...props}: React.ComponentProps<'div'>) {
    return <div ref={ref} className={clsx(styles.cardFooter, className)} {...props} />;
}

// ── SectionCard ───────────────────────────────────────────────────────────────
//
// Card com header bordado + body. Suporta appearance "default" (padding normal),
// "flush" e "sm".

const sectionCardBodyVariants = cva('', {
    variants: {
        appearance: {
            default: styles.sectionCardBodyDefault,
            flush: styles.sectionCardBodyFlush,
            sm: styles.sectionCardBodySm,
        },
    },
    defaultVariants: {appearance: 'default'},
});

function SectionCard({className, ref, ...props}: React.ComponentProps<'div'>) {
    return <div ref={ref} className={clsx(styles.sectionCard, className)} {...props} />;
}

function SectionCardHeader({
    className,
    action,
    ref,
    children,
    ...props
}: React.ComponentProps<'div'> & {action?: React.ReactNode}) {
    return (
        <div ref={ref} className={clsx(styles.sectionCardHeader, className)} {...props}>
            <div className="flex items-center gap-2">{children}</div>
            {action && <div className="flex items-center gap-1">{action}</div>}
        </div>
    );
}

function SectionCardTitle({className, ref, ...props}: React.ComponentProps<'div'>) {
    return <div ref={ref} className={clsx(styles.sectionCardTitle, className)} {...props} />;
}

function SectionCardBody({
    className,
    appearance,
    ref,
    ...props
}: React.ComponentProps<'div'> & VariantProps<typeof sectionCardBodyVariants>) {
    return <div ref={ref} className={cn(sectionCardBodyVariants({appearance}), className)} {...props} />;
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
