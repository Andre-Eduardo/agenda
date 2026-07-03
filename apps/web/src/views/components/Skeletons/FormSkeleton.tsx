import {Skeleton} from '@/components/ui/componentes/skeleton';
import * as styles from './styles';

interface FormSkeletonProps {
    fields?: number;
}

export function FormSkeleton({fields = 5}: FormSkeletonProps) {
    // Skeletons are placeholders with no identity — index-based keys are safe.
    return (
        <div className={styles.formRoot}>
            {Array.from({length: fields}).map((_, i) => (
                // eslint-disable-next-line react/no-array-index-key -- skeleton placeholders have no identity; index keys are stable here
                <div key={`field-${i}`} className={styles.formField}>
                    <Skeleton className={styles.formFieldLabel} />
                    <Skeleton className={styles.formFieldInput} />
                </div>
            ))}
            <div className={styles.formActions}>
                <Skeleton className={styles.formActionButton} />
                <Skeleton className={styles.formActionButton} />
            </div>
        </div>
    );
}
