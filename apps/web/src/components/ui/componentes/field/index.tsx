import {AlertCircle} from 'lucide-react';
import {Label} from '@/components/ui/componentes/label';
import {cn} from '@/lib/utils';
import {cx, css} from '@/styled-system/css';
import {
    error,
    field,
    formGrid,
    formGridCols12,
    formGridCols3,
    formGridCols4,
    formGridCols6,
    hint,
    labelRow,
    optionalText,
    requiredMark,
} from './styles';

const colSpanMap: Record<number, string> = {
    1: css({gridColumn: '[span 1 / span 1]'}),
    2: css({gridColumn: '[span 2 / span 2]'}),
    3: css({gridColumn: '[span 3 / span 3]'}),
    4: css({gridColumn: '[span 4 / span 4]'}),
    5: css({gridColumn: '[span 5 / span 5]'}),
    6: css({gridColumn: '[span 6 / span 6]'}),
    7: css({gridColumn: '[span 7 / span 7]'}),
    8: css({gridColumn: '[span 8 / span 8]'}),
    9: css({gridColumn: '[span 9 / span 9]'}),
    10: css({gridColumn: '[span 10 / span 10]'}),
    11: css({gridColumn: '[span 11 / span 11]'}),
    12: css({gridColumn: '[span 12 / span 12]'}),
};

export interface FieldProps {
    label?: string;
    required?: boolean;
    optional?: boolean;
    hint?: string;
    error?: string;
    htmlFor?: string;
    cols?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    className?: string;
    children: React.ReactNode;
}

function Field({label, required, optional, hint, error: errorMessage, htmlFor, cols, className, children}: FieldProps) {
    return (
        <div className={cn(field, cols && colSpanMap[cols], className)}>
            {label && (
                <div className={labelRow}>
                    <Label htmlFor={htmlFor}>{label}</Label>
                    {required && <span className={requiredMark}>*</span>}
                    {optional && <span className={optionalText}>(opcional)</span>}
                </div>
            )}
            {children}
            {errorMessage && (
                <span className={error}>
                    <AlertCircle className={css({w: '3', h: '3', flexShrink: '0'})} />
                    {errorMessage}
                </span>
            )}
            {!errorMessage && hint && <span className={hint}>{hint}</span>}
        </div>
    );
}

export interface FormGridProps extends React.ComponentProps<'div'> {
    cols?: 12 | 6 | 4 | 3;
}

const formGridColsClass = {
    12: formGridCols12,
    6: formGridCols6,
    4: formGridCols4,
    3: formGridCols3,
} as const;

function FormGrid({cols = 12, className, ...props}: FormGridProps) {
    return <div className={cx(formGrid, formGridColsClass[cols], className)} {...props} />;
}

export {Field, FormGrid};
