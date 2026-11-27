import {useGetMyModules, type ClinicAccountType, type OperationalModuleType} from '@agenda-app/client';

const MODULES_STALE_TIME = 5 * 60 * 1000;

export interface AccountState {
    /** SOLO = autônomo (conta de uma pessoa); CLINIC = clínica com equipe. Null while unknown. */
    accountType: ClinicAccountType | null;
    isSolo: boolean;
    /** Account info is still being fetched and nothing is cached yet. */
    isLoading: boolean;
    /** Whether the clinic module (team, reception) is on for the current account. */
    hasClinicModule: (module: OperationalModuleType) => boolean;
}

/**
 * Account type and clinic modules of the current clinic, from GET /clinic-members/me/modules.
 * Screens ask for a clinic module, never for the account type, except for wording.
 * While loading, clinic modules read as off (deny by default); the server authorizes anyway.
 */
export function useAccount(): AccountState {
    const {data, isPending} = useGetMyModules({query: {staleTime: MODULES_STALE_TIME}});
    const operationalModules = data?.operationalModules ?? [];

    return {
        accountType: data?.accountType ?? null,
        isSolo: data?.accountType === 'SOLO',
        isLoading: isPending && !data,
        hasClinicModule: (module) => operationalModules.includes(module),
    };
}
