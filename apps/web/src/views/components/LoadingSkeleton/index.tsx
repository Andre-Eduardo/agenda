import {Skeleton} from '@/components/ui/componentes/skeleton';
import * as styles from './styles';

interface LoadingSkeletonProps {
    rows?: number;
    height?: number;
}

export function LoadingSkeleton({rows = 5, height = 48}: LoadingSkeletonProps) {
    // Skeletons are placeholders with no identity — index-based keys are safe.
    return (
        <div className={styles.root}>
            {Array.from({length: rows}).map((_, i) => (
                <Skeleton
                    // eslint-disable-next-line react/no-array-index-key -- skeleton placeholders have no identity; index keys are stable here
                    key={`row-${i}`}
                    className={styles.row}
                    style={{height}}
                />
            ))}
        </div>
    );
}
