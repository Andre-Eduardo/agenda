import {Slot} from '@radix-ui/react-slot';
import {cx} from '@/styled-system/css';
import type {RecipeVariantProps} from '@/styled-system/css';
import {buttonVariants} from './styles';

// ── Props ─────────────────────────────────────────────────────────────────────

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
    RecipeVariantProps<typeof buttonVariants> & {
        /** Renderiza como filho via Radix Slot (útil para links/router). */
        asChild?: boolean;
        ref?: React.Ref<HTMLButtonElement>;
    };

// ── Componente ────────────────────────────────────────────────────────────────

function Button({className, variant, size, asChild = false, ref, ...props}: ButtonProps) {
    const Comp = asChild ? Slot : 'button';

    return <Comp ref={ref} className={cx(buttonVariants({variant, size}), className)} {...props} />;
}

export {Button, buttonVariants};
