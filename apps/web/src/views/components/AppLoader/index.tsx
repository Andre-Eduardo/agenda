import {Loader2} from 'lucide-react';
import {cx} from '@/styled-system/css';
import * as styles from './styles';

export function AppLoader() {
    return (
        <div className={styles.root}>
            <Loader2 aria-label="Loading" className={cx(styles.icon, 'animate-spin')} />
        </div>
    );
}
