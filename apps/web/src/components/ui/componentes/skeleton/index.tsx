import {clsx} from 'clsx';
import styles from './skeleton.module.css';

function Skeleton({className, ...props}: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={clsx(styles.base, className)} {...props} />;
}

export {Skeleton};
