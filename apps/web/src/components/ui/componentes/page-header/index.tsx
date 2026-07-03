import {cx} from '@/styled-system/css';
import {
    entityHeader,
    entityHeaderActions,
    entityHeaderAlerts,
    entityHeaderAvatarGroup,
    entityHeaderMeta,
    entityHeaderName,
    entityHeaderNameGroup,
    entityHeaderRow,
    entityHeaderSticky,
    pageHeader,
    pageHeaderActions,
    pageHeaderRow,
    pageHeaderSubtitle,
    pageHeaderTitle,
    pageHeaderTitleGroup,
} from './styles';

// ── PageHeader ────────────────────────────────────────────────────────────────

export interface PageHeaderProps extends React.ComponentProps<'div'> {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    breadcrumb?: React.ReactNode;
}

function PageHeader({title, subtitle, actions, breadcrumb, className, ref, ...props}: PageHeaderProps) {
    return (
        <div ref={ref} className={cx(pageHeader, className)} {...props}>
            {breadcrumb && <div>{breadcrumb}</div>}
            <div className={pageHeaderRow}>
                <div className={pageHeaderTitleGroup}>
                    <h1 className={pageHeaderTitle}>{title}</h1>
                    {subtitle && <p className={pageHeaderSubtitle}>{subtitle}</p>}
                </div>
                {actions && <div className={pageHeaderActions}>{actions}</div>}
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
        <div ref={ref} className={cx(entityHeader, sticky && entityHeaderSticky, className)} {...props}>
            <div className={entityHeaderRow}>
                <div className={entityHeaderAvatarGroup}>
                    {avatar}
                    <div className={entityHeaderNameGroup}>
                        <div className={entityHeaderName}>{name}</div>
                        {meta && <div className={entityHeaderMeta}>{meta}</div>}
                    </div>
                </div>
                {actions && <div className={entityHeaderActions}>{actions}</div>}
            </div>
            {alerts && <div className={entityHeaderAlerts}>{alerts}</div>}
        </div>
    );
}

export {PageHeader, EntityHeader};
