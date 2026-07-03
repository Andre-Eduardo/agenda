import * as SeparatorPrimitive from '@radix-ui/react-separator';
import {cx} from '@/styled-system/css';
import {base, horizontal, vertical} from './styles';

function Separator({
    className,
    orientation = 'horizontal',
    decorative = true,
    ref,
    ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
    return (
        <SeparatorPrimitive.Root
            ref={ref}
            decorative={decorative}
            orientation={orientation}
            className={cx(base, orientation === 'horizontal' ? horizontal : vertical, className)}
            {...props}
        />
    );
}

export {Separator};
