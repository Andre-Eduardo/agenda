import type {ReactNode} from 'react';
import {useCanState, type Permission} from '@/hooks/useCan';

type CanChildren = ReactNode | ((allowed: boolean) => ReactNode);

interface CanProps {
    has?: Permission;
    hasAny?: Permission[];
    hasAll?: Permission[];
    granted?: ReactNode;
    denied?: ReactNode;
    /** Rendered instead of `denied` while permissions are loading, so a denial is never flashed. */
    loading?: ReactNode;
    children?: CanChildren;
}

export function Can({has, hasAny, hasAll, granted, denied, loading = null, children}: CanProps) {
    const {allowed, isLoading} = useCanState({has, hasAny, hasAll});

    if (typeof children === 'function') {
        return <>{children(allowed)}</>;
    }

    if (isLoading) {
        return <>{loading}</>;
    }

    if (granted !== undefined || denied !== undefined) {
        return <>{allowed ? granted : denied}</>;
    }

    return allowed ? <>{children}</> : null;
}
