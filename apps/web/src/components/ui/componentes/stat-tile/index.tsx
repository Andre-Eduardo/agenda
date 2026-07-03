import {cx} from '@/styled-system/css';
import {
    delta,
    deltaNegative,
    deltaNeutral,
    deltaPositive,
    header,
    iconAi,
    iconBase,
    iconDanger,
    iconInfo,
    iconLg,
    iconMd,
    iconMuted,
    iconPrimary,
    iconSm,
    iconSuccess,
    iconWarning,
    label,
    root,
    value as valueClass,
    valueSkeleton,
} from './styles';

// ── Icon variant helper ───────────────────────────────────────────────────────
//
// Drop-in replacement for the original cva: accepts {size?, intent?} object
// identical to the previous API so existing callers don't need to change.

type IconSize = 'sm' | 'md' | 'lg';
type IconIntent = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'ai';

const iconSizeClass: Record<IconSize, string> = {
    sm: iconSm,
    md: iconMd,
    lg: iconLg,
};

const iconIntentClass: Record<IconIntent, string> = {
    primary: iconPrimary,
    success: iconSuccess,
    warning: iconWarning,
    danger: iconDanger,
    info: iconInfo,
    muted: iconMuted,
    ai: iconAi,
};

export function statTileIconVariants({size = 'md', intent = 'primary'}: {size?: IconSize; intent?: IconIntent} = {}) {
    return cx(iconBase, iconSizeClass[size], iconIntentClass[intent]);
}

// ── Delta variants ────────────────────────────────────────────────────────────

const deltaClass = {
    positive: deltaPositive,
    negative: deltaNegative,
    neutral: deltaNeutral,
} as const;

// ── Component ─────────────────────────────────────────────────────────────────

export interface StatTileProps extends React.ComponentProps<'div'> {
    loading?: boolean;
    label: string;
    value: React.ReactNode;
    delta?: React.ReactNode;
    deltaIntent?: keyof typeof deltaClass;
    icon?: React.ReactNode;
    iconIntent?: IconIntent;
}

function StatTile({
    label,
    value,
    delta: deltaValue,
    deltaIntent = 'neutral',
    icon,
    iconIntent = 'primary',
    loading,
    className,
    ref,
    ...props
}: StatTileProps) {
    return (
        <div ref={ref} className={cx(root, className)} {...props}>
            <div className={header}>
                <span className={label}>{label}</span>
                {icon && <span className={statTileIconVariants({intent: iconIntent})}>{icon}</span>}
            </div>
            {loading ? <div className={valueSkeleton} /> : <div className={valueClass}>{value}</div>}
            {deltaValue !== undefined && <div className={cx(delta, deltaClass[deltaIntent])}>{deltaValue}</div>}
        </div>
    );
}

export {StatTile};
