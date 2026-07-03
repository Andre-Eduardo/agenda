import {cx} from '@/styled-system/css';
import {
    grid,
    gridCols2,
    gridCols3,
    gridCols4,
    label,
    root,
    value as valueClass,
    valueEmpty,
    valueMono,
} from './styles';

export interface KVProps extends React.ComponentProps<'div'> {
    label: string;
    value?: React.ReactNode;
    mono?: boolean;
    emptyText?: string;
}

function KV({label, value, mono, emptyText = '—', className, ref, ...props}: KVProps) {
    const isEmpty = value === null || value === undefined || value === '';
    return (
        <div ref={ref} className={cx(root, className)} {...props}>
            <dt className={label}>{label}</dt>
            <dd className={cx(valueClass, mono && valueMono, isEmpty && valueEmpty)}>
                {isEmpty ? emptyText : value}
            </dd>
        </div>
    );
}

// Grade de KV — substitui kvGrid nos módulos

const colsClass = {
    2: gridCols2,
    3: gridCols3,
    4: gridCols4,
} as const;

function KVGrid({cols = 2, className, ref, ...props}: React.ComponentProps<'dl'> & {cols?: 2 | 3 | 4}) {
    return <dl ref={ref} className={cx(grid, colsClass[cols], className)} {...props} />;
}

export {KV, KVGrid};
