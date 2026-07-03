import type {RecipeVariantProps} from '@/styled-system/css';
import {cx} from '@/styled-system/css';
import {inputVariants} from '@/components/ui/componentes/input';
import {base} from './styles';

export type TextareaProps = React.ComponentProps<'textarea'> & RecipeVariantProps<typeof inputVariants>;

function Textarea({className, appearance, state, ref, ...props}: TextareaProps) {
    return <textarea ref={ref} className={cx(inputVariants({appearance, state}), base, className)} {...props} />;
}

export {Textarea};
