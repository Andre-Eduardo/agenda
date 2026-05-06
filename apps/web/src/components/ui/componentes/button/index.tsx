import {Slot} from '@radix-ui/react-slot';
import {cva, type VariantProps} from 'class-variance-authority';

import {cn} from '@/lib/utils';
import styles from './button.module.css';

// ── Variantes ─────────────────────────────────────────────────────────────────
//
// Cada chave aponta para uma classe CSS Module — o `cva` combina os módulos
// em runtime exatamente como faria com classes Tailwind inline.

const buttonVariants = cva(styles.base, {
    variants: {
        variant: {
            default:     styles.variantDefault,
            destructive: styles.variantDestructive,
            outline:     styles.variantOutline,
            secondary:   styles.variantSecondary,
            ghost:       styles.variantGhost,
            link:        styles.variantLink,
            ai:          styles.variantAi,
        },
        size: {
            default:   styles.sizeDefault,
            sm:        styles.sizeSm,
            lg:        styles.sizeLg,
            icon:      styles.sizeIcon,
            'icon-sm': styles.sizeIconSm,
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
    },
});

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    /** Renderiza como filho via Radix Slot (útil para links/router). */
    asChild?: boolean;
    ref?: React.Ref<HTMLButtonElement>;
}

// ── Componente ────────────────────────────────────────────────────────────────

function Button({className, variant, size, asChild = false, ref, ...props}: ButtonProps) {
    const Comp = asChild ? Slot : 'button';
    return (
        <Comp
            ref={ref}
            className={cn(buttonVariants({variant, size}), className)}
            {...props}
        />
    );
}

export {Button, buttonVariants};
