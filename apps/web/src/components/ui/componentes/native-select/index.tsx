import type {RecipeVariantProps} from '@/styled-system/css';
import {cx} from '@/styled-system/css';
import {inputVariants} from '@/components/ui/componentes/input';
import {base} from './styles';

export type NativeSelectProps = React.ComponentProps<'select'> & RecipeVariantProps<typeof inputVariants>;

function NativeSelect({className, appearance, state, ref, ...props}: NativeSelectProps) {
    return <select ref={ref} className={cx(inputVariants({appearance, state}), base, className)} {...props} />;
}

export {NativeSelect};
