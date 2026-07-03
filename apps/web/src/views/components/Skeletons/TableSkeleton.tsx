import {Skeleton} from '@/components/ui/componentes/skeleton';
import * as styles from './styles';

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
}

export function TableSkeleton({rows = 6, columns = 4}: TableSkeletonProps) {
    // Skeletons are placeholders with no identity — index-based keys are safe.
    /* eslint-disable react/no-array-index-key -- skeleton placeholders have no identity; index keys are stable here */
    return (
        <div className={styles.tableRoot}>
            <div className={styles.tableHeader}>
                {Array.from({length: columns}).map((_, i) => (
                    <Skeleton key={`h-${i}`} className={styles.tableHeaderCell} />
                ))}
            </div>
            {Array.from({length: rows}).map((_, r) => (
                <div key={`r-${r}`} className={styles.tableRow}>
                    {Array.from({length: columns}).map((_inner, c) => (
                        <Skeleton key={`r-${r}-c-${c}`} className={styles.tableCell} />
                    ))}
                </div>
            ))}
        </div>
    );
    /* eslint-enable react/no-array-index-key -- end skeleton block */
}
