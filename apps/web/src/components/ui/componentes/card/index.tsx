import {cx} from '@/styled-system/css';
import type {RecipeVariantProps} from '@/styled-system/css';
import {
    card,
    cardContent,
    cardDescription,
    cardFooter,
    cardHeader,
    cardTitle,
    sectionCard,
    sectionCardBodyVariants,
    sectionCardHeader,
    sectionCardHeaderActions,
    sectionCardHeaderStart,
    sectionCardTitle,
} from './styles';

// ── Card ──────────────────────────────────────────────────────────────────────

function Card({className, ref, ...props}: React.ComponentProps<'div'>) {
    return <div ref={ref} className={cx(card, className)} {...props} />;
}

function CardHeader({className, ref, ...props}: React.ComponentProps<'div'>) {
    return <div ref={ref} className={cx(cardHeader, className)} {...props} />;
}

function CardTitle({className, ref, ...props}: React.ComponentProps<'div'>) {
    return <div ref={ref} className={cx(cardTitle, className)} {...props} />;
}

function CardDescription({className, ref, ...props}: React.ComponentProps<'div'>) {
    return <div ref={ref} className={cx(cardDescription, className)} {...props} />;
}

function CardContent({className, ref, ...props}: React.ComponentProps<'div'>) {
    return <div ref={ref} className={cx(cardContent, className)} {...props} />;
}

function CardFooter({className, ref, ...props}: React.ComponentProps<'div'>) {
    return <div ref={ref} className={cx(cardFooter, className)} {...props} />;
}

// ── SectionCard ───────────────────────────────────────────────────────────────
//
// Card com header bordado + body. Suporta appearance "default" (padding normal),
// "flush" e "sm".

function SectionCard({className, ref, ...props}: React.ComponentProps<'div'>) {
    return <div ref={ref} className={cx(sectionCard, className)} {...props} />;
}

function SectionCardHeader({
    className,
    action,
    ref,
    children,
    ...props
}: React.ComponentProps<'div'> & {action?: React.ReactNode}) {
    return (
        <div ref={ref} className={cx(sectionCardHeader, className)} {...props}>
            <div className={sectionCardHeaderStart}>{children}</div>
            {action && <div className={sectionCardHeaderActions}>{action}</div>}
        </div>
    );
}

function SectionCardTitle({className, ref, ...props}: React.ComponentProps<'div'>) {
    return <div ref={ref} className={cx(sectionCardTitle, className)} {...props} />;
}

function SectionCardBody({
    className,
    appearance,
    ref,
    ...props
}: React.ComponentProps<'div'> & RecipeVariantProps<typeof sectionCardBodyVariants>) {
    return <div ref={ref} className={cx(sectionCardBodyVariants({appearance}), className)} {...props} />;
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
