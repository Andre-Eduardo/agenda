import type {ReactNode} from 'react';
import {Inbox, type LucideIcon} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import * as styles from './styles';

interface EmptyStateProps {
    icon?: LucideIcon;
    title?: string;
    message?: string;
    action?: ReactNode;
}

export function EmptyState({icon: Icon = Inbox, title, message, action}: EmptyStateProps) {
    const {t} = useTranslation();

    return (
        <div className={styles.root}>
            <div className={styles.iconWrapper}>
                <Icon aria-hidden className={styles.icon} />
            </div>
            <p className={styles.title}>{title ?? t('states.empty')}</p>
            {message && <p className={styles.message}>{message}</p>}
            {action}
        </div>
    );
}
