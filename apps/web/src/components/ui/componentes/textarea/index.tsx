import {type VariantProps} from 'class-variance-authority';
import {inputVariants} from '@/components/ui/componentes/input';
import {cn} from '@/lib/utils';
import styles from './textarea.module.css';

export interface TextareaProps extends React.ComponentProps<'textarea'>, VariantProps<typeof inputVariants> {}

function Textarea({className, appearance, state, ref, ...props}: TextareaProps) {
    return <textarea ref={ref} className={cn(inputVariants({appearance, state}), styles.base, className)} {...props} />;
}

export {Textarea};
