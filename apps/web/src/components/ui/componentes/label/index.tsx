import * as LabelPrimitive from '@radix-ui/react-label';
import {cx} from '@/styled-system/css';
import {base} from './styles';

function Label({className, ref, ...props}: React.ComponentProps<typeof LabelPrimitive.Root>) {
    return <LabelPrimitive.Root ref={ref} className={cx(base, className)} {...props} />;
}

export {Label};
