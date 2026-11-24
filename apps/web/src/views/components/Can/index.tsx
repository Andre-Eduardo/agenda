import type {ReactNode} from 'react';
import type {ModuleType} from '@agenda-app/client';
import {useCanState, type Permission} from '@/hooks/useCan';
import {useModuleState} from '@/hooks/useHasModule';

type CanChildren = ReactNode | ((allowed: boolean) => ReactNode);

interface CanProps {
    has?: Permission;
    hasAny?: Permission[];
    hasAll?: Permission[];
    /** Also requires the current member to be released by the clinic for this AI module. */
    module?: ModuleType;
    granted?: ReactNode;
    denied?: ReactNode;
    /** Rendered instead of `denied` while permissions are loading, so a denial is never flashed. */
    loading?: ReactNode;
    children?: CanChildren;
}

export function Can({has, hasAny, hasAll, module, granted, denied, loading = null, children}: CanProps) {
    const {allowed: hasPermission, isLoading: permissionLoading} = useCanState({has, hasAny, hasAll});
    const {enabled: hasModule, isLoading: moduleLoading} = useModuleState(module);
    const allowed = hasPermission && hasModule;
    const isLoading = permissionLoading || moduleLoading;

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
