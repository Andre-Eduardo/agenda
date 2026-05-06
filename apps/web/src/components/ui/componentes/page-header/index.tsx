import {clsx} from 'clsx';
import styles from './page-header.module.css';

// ── PageHeader ────────────────────────────────────────────────────────────────

export interface PageHeaderProps extends React.ComponentProps<'div'> {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    breadcrumb?: React.ReactNode;
}

function PageHeader({title, subtitle, actions, breadcrumb, className, ref, ...props}: PageHeaderProps) {
    return (
        <div ref={ref} className={clsx(styles.pageHeader, className)} {...props}>
            {breadcrumb && <div>{breadcrumb}</div>}
            <div className={styles.pageHeaderRow}>
                <div className={styles.pageHeaderTitleGroup}>
                    <h1 className={styles.pageHeaderTitle}>{title}</h1>
                    {subtitle && <p className={styles.pageHeaderSubtitle}>{subtitle}</p>}
                </div>
                {actions && <div className={styles.pageHeaderActions}>{actions}</div>}
            </div>
        </div>
    );
}

// ── EntityHeader ──────────────────────────────────────────────────────────────
//
// Variante para detail pages — card sticky com avatar + nome + meta + ações.

export interface EntityHeaderProps extends React.ComponentProps<'div'> {
    avatar?: React.ReactNode;
    name: React.ReactNode;
    meta?: React.ReactNode;
    actions?: React.ReactNode;
    alerts?: React.ReactNode;
    sticky?: boolean;
}

function EntityHeader({
    avatar,
    name,
    meta,
    actions,
    alerts,
    sticky = true,
    className,
    ref,
    ...props
}: EntityHeaderProps) {
    return (
        <div ref={ref} className={clsx(styles.entityHeader, sticky && styles.entityHeaderSticky, className)} {...props}>
            <div className={styles.entityHeaderRow}>
                <div className={styles.entityHeaderAvatarGroup}>
                    {avatar}
                    <div className={styles.entityHeaderNameGroup}>
                        <div className={styles.entityHeaderName}>{name}</div>
                        {meta && <div className={styles.entityHeaderMeta}>{meta}</div>}
                    </div>
                </div>
                {actions && <div className={styles.entityHeaderActions}>{actions}</div>}
            </div>
            {alerts && <div className={styles.entityHeaderAlerts}>{alerts}</div>}
        </div>
    );
}

export {PageHeader, EntityHeader};
