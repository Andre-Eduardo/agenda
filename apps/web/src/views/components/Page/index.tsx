import type {ReactNode} from 'react';
import {cx} from '@/styled-system/css';
import * as styles from './styles';
import {header} from './styles';

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
        <div className={cx(styles.root, className)}>
            <header className={header({responsive: responsiveActions})}>
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
