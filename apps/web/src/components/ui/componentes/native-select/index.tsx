import {type VariantProps} from 'class-variance-authority';
import {inputVariants} from '@/components/ui/componentes/input';
import {cn} from '@/lib/utils';
import styles from './native-select.module.css';

export interface NativeSelectProps extends React.ComponentProps<'select'>, VariantProps<typeof inputVariants> {}

function NativeSelect({className, appearance, state, ref, ...props}: NativeSelectProps) {
    return <select ref={ref} className={cn(inputVariants({appearance, state}), styles.base, className)} {...props} />;
}

export {NativeSelect};
