import type {HTMLAttributes} from 'react';
import {cx} from '@/styled-system/css';
import type {RecipeVariantProps} from '@/styled-system/css';
import {badgeVariants} from './styles';

// ── Props ─────────────────────────────────────────────────────────────────────

type BadgeProps = HTMLAttributes<HTMLDivElement> & RecipeVariantProps<typeof badgeVariants>;

// ── Componente ────────────────────────────────────────────────────────────────

function Badge({className, variant, status, gender, severity, clinicalStatus, origin, size, ...props}: BadgeProps) {
    return (
        <div
            className={cx(
                badgeVariants({variant, status, gender, severity, clinicalStatus, origin, size}),
                className
            )}
            {...props}
        />
    );
}

export {Badge, badgeVariants};
