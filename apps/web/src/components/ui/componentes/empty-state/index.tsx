import {cx} from '@/styled-system/css';
import {actionWrapper, card, description, icon as iconClass, root, textGroup, title as titleClass} from './styles';

export interface EmptyStateProps extends React.ComponentProps<'div'> {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

function EmptyState({icon, title, description, action, className, ref, ...props}: EmptyStateProps) {
    return (
        <div ref={ref} className={cx(root, className)} {...props}>
            {icon && <span className={iconClass}>{icon}</span>}
            <div className={textGroup}>
                <p className={titleClass}>{title}</p>
                {description && <p className={description}>{description}</p>}
            </div>
            {action && <div className={actionWrapper}>{action}</div>}
        </div>
    );
}

// Wrapper com borda de card — uso mais comum em listas
function EmptyStateCard({className, ref, ...props}: React.ComponentProps<typeof EmptyState>) {
    return (
        <div className={cx(card, className)}>
            <EmptyState ref={ref} {...props} />
        </div>
    );
}

export {EmptyState, EmptyStateCard};
