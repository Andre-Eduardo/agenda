import {clsx} from 'clsx';
import styles from './empty-state.module.css';

export interface EmptyStateProps extends React.ComponentProps<'div'> {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

function EmptyState({icon, title, description, action, className, ref, ...props}: EmptyStateProps) {
    return (
        <div ref={ref} className={clsx(styles.root, className)} {...props}>
            {icon && <span className={styles.icon}>{icon}</span>}
            <div className={styles.textGroup}>
                <p className={styles.title}>{title}</p>
                {description && <p className={styles.description}>{description}</p>}
            </div>
            {action && <div className="mt-1">{action}</div>}
        </div>
    );
}

// Wrapper com borda de card — uso mais comum em listas
function EmptyStateCard({className, ref, ...props}: React.ComponentProps<typeof EmptyState>) {
    return (
        <div className={clsx(styles.card, className)}>
            <EmptyState ref={ref} {...props} />
        </div>
    );
}

export {EmptyState, EmptyStateCard};
