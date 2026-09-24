import {useGetCurrentClinicMemberPermissions} from '@agenda-app/client';

export type Permission = string;

export interface UseCanProps {
    has?: Permission;
    hasAny?: Permission[];
    hasAll?: Permission[];
}

export interface CanState {
    allowed: boolean;
    /** Permissions are still being fetched and nothing is cached yet. */
    isLoading: boolean;
    /** Permissions could not be fetched and nothing is cached. */
    isError: boolean;
}

const PERMISSIONS_STALE_TIME = 5 * 60 * 1000;

function isRestricted({has, hasAny, hasAll}: UseCanProps): boolean {
    return has !== undefined || hasAny !== undefined || hasAll !== undefined;
}

function evaluate(granted: readonly Permission[], {has, hasAny, hasAll}: UseCanProps): boolean {
    return (
        (has === undefined || granted.includes(has)) &&
        (hasAny === undefined || hasAny.some((permission) => granted.includes(permission))) &&
        (hasAll === undefined || hasAll.every((permission) => granted.includes(permission)))
    );
}

/**
 * Permission gate with its loading/error state exposed.
 *
 * Permissions come from `GET /clinic-members/me/permissions`, computed by the server for the
 * active clinic member. The gate fails closed: while they load, or when the request fails and
 * nothing is cached, `allowed` is `false`. Once fetched, the last known permissions keep being
 * used if a background refetch fails. This only shapes the UI; the server enforces access.
 *
 * When several of `has`, `hasAny` and `hasAll` are given, all of them must hold. With none of
 * them the check is unrestricted and no request is made.
 */
export function useCanState(props: UseCanProps = {}): CanState {
    const restricted = isRestricted(props);
    const {data, isPending, isError} = useGetCurrentClinicMemberPermissions({
        query: {enabled: restricted, staleTime: PERMISSIONS_STALE_TIME},
    });

    if (!restricted) return {allowed: true, isLoading: false, isError: false};

    if (!data) return {allowed: false, isLoading: isPending, isError};

    return {allowed: evaluate(data.permissions, props), isLoading: false, isError: false};
}

/** Returns true when the active clinic member has the requested permission(s). */
export function useCan(props?: UseCanProps): boolean {
    return useCanState(props).allowed;
}
