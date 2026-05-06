import {clsx} from 'clsx';
import styles from './stat-tile.module.css';

// ── Icon variant helper ───────────────────────────────────────────────────────
//
// Drop-in replacement for the original cva: accepts {size?, intent?} object
// identical to the previous API so existing callers don't need to change.

type IconSize = 'sm' | 'md' | 'lg';
type IconIntent = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'ai';

const iconSizeClass: Record<IconSize, string> = {
    sm: styles.iconSm,
    md: styles.iconMd,
    lg: styles.iconLg,
};

const iconIntentClass: Record<IconIntent, string> = {
    primary: styles.iconPrimary,
    success: styles.iconSuccess,
    warning: styles.iconWarning,
    danger: styles.iconDanger,
    info: styles.iconInfo,
    muted: styles.iconMuted,
    ai: styles.iconAi,
};

export function statTileIconVariants({size = 'md', intent = 'primary'}: {size?: IconSize; intent?: IconIntent} = {}) {
    return clsx(styles.iconBase, iconSizeClass[size], iconIntentClass[intent]);
}

// ── Delta variants ────────────────────────────────────────────────────────────

const deltaClass = {
    positive: styles.deltaPositive,
    negative: styles.deltaNegative,
    neutral: styles.deltaNeutral,
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
    delta,
    deltaIntent = 'neutral',
    icon,
    iconIntent = 'primary',
    loading,
    className,
    ref,
    ...props
}: StatTileProps) {
    return (
        <div ref={ref} className={clsx(styles.root, className)} {...props}>
            <div className={styles.header}>
                <span className={styles.label}>{label}</span>
                {icon && <span className={statTileIconVariants({intent: iconIntent})}>{icon}</span>}
            </div>
            {loading ? <div className={styles.valueSkeleton} /> : <div className={styles.value}>{value}</div>}
            {delta !== undefined && <div className={clsx(styles.delta, deltaClass[deltaIntent])}>{delta}</div>}
        </div>
    );
}

export {StatTile};
