import {cx} from '@/styled-system/css';
import type {RecipeVariantProps} from '@/styled-system/css';
import {inputVariants, leadIcon, trailIcon, withLeadIcon, withTrailIcon, wrapper} from './styles';

// ── Props ─────────────────────────────────────────────────────────────────────

export type InputProps = React.ComponentProps<'input'> &
    RecipeVariantProps<typeof inputVariants> & {
        leadIcon?: React.ReactNode;
        trailIcon?: React.ReactNode;
    };

// ── Componente ────────────────────────────────────────────────────────────────

function Input({className, type, appearance, state, leadIcon: LeadIconNode, trailIcon: TrailIconNode, ref, ...props}: InputProps) {
    const inputEl = (
        <input
            type={type}
            ref={ref}
            className={cx(
                inputVariants({appearance, state}),
                !!LeadIconNode && withLeadIcon,
                !!TrailIconNode && withTrailIcon,
                className
            )}
            {...props}
        />
    );

    if (!LeadIconNode && !TrailIconNode) return inputEl;

    return (
        <div className={wrapper}>
            {LeadIconNode && <span className={leadIcon}>{LeadIconNode}</span>}
            {inputEl}
            {TrailIconNode && <span className={trailIcon}>{TrailIconNode}</span>}
        </div>
    );
}

export {Input, inputVariants};
