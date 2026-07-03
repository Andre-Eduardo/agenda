import {cx} from '@/styled-system/css';
import {base} from './styles';

function Skeleton({className, ...props}: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cx(base, className)} {...props} />;
}

export {Skeleton};
