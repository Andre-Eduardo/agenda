import {useGetMyModules, type ModuleType} from '@agenda-app/client';

export interface ModuleState {
    enabled: boolean;
    /** Modules are still being fetched and nothing is cached yet. */
    isLoading: boolean;
    /** Modules could not be fetched and nothing is cached. */
    isError: boolean;
}

const MODULES_STALE_TIME = 5 * 60 * 1000;

export function useModuleState(module?: ModuleType): ModuleState {
    const {data, isPending, isError} = useGetMyModules({
        query: {enabled: module !== undefined, staleTime: MODULES_STALE_TIME},
    });

    if (module === undefined) return {enabled: true, isLoading: false, isError: false};

    if (!data) return {enabled: false, isLoading: isPending, isError};

    return {enabled: data.modules.includes(module), isLoading: false, isError: false};
}

/** Whether the current clinic member was released by the clinic to use the given AI module. */
export function useHasModule(module?: ModuleType): boolean {
    return useModuleState(module).enabled;
}
