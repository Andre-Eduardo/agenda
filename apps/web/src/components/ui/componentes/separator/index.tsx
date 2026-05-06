import * as SeparatorPrimitive from '@radix-ui/react-separator';
import {clsx} from 'clsx';
import styles from './separator.module.css';

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
            className={clsx(styles.base, orientation === 'horizontal' ? styles.horizontal : styles.vertical, className)}
            {...props}
        />
    );
}

export {Separator};
