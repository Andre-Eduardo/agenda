import * as LabelPrimitive from '@radix-ui/react-label';
import {clsx} from 'clsx';

import styles from './label.module.css';

function Label({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return <LabelPrimitive.Root ref={ref} className={clsx(styles.base, className)} {...props} />;
}

export {Label};
