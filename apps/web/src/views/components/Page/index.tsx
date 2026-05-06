import type {ReactNode} from 'react';
import {clsx} from 'clsx';
import {cn} from '@/lib/utils';
import styles from './page.module.css';

interface PageProps {
    title: string;
    subtitle?: ReactNode;
    actions?: ReactNode;
    responsiveActions?: boolean;
    children: ReactNode;
    className?: string;
}

export function Page({title, subtitle, actions, responsiveActions = false, children, className}: PageProps) {
    return (
        <div className={cn(styles.root, className)}>
            <header className={clsx(styles.header, responsiveActions ? styles.headerResponsive : styles.headerDefault)}>
                <div className={styles.titleGroup}>
                    <h1 className={styles.title}>{title}</h1>
                    {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                </div>
                {actions && <div className={styles.actions}>{actions}</div>}
            </header>
            <main className={styles.main}>{children}</main>
        </div>
    );
}
