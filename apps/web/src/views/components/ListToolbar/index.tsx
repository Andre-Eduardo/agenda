import type {ReactNode} from 'react';
import {Search} from 'lucide-react';
import {Input} from '@/components/ui/componentes/input';
import * as styles from './styles';

interface ListToolbarProps {
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
    filters?: ReactNode;
    actions?: ReactNode;
}

export function ListToolbar({
    searchValue = '',
    onSearchChange,
    searchPlaceholder = 'Buscar...',
    filters,
    actions,
}: ListToolbarProps) {
    return (
        <div className={styles.root}>
            <div className={styles.left}>
                {onSearchChange && (
                    <div className={styles.searchWrapper}>
                        <Search aria-hidden className={styles.searchIcon} />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                )}
                {filters}
            </div>
            {actions && <div className={styles.actions}>{actions}</div>}
        </div>
    );
}
