export type Permission = string;

export interface UseCanProps {
  has?: Permission;
  hasAny?: Permission[];
  hasAll?: Permission[];
}

/**
 * Permission gate hook. Returns true when the user has the requested permission(s).
 *
 * NOTE: until the backend exposes a permissions endpoint via Orval (e.g.
 * `useGetUserPermissions` from `@agenda-app/client`), this hook returns `true`
 * for everything. Wire it to the real query as soon as the endpoint exists,
 * matching the API documented in docs/frontend/03-auth.md.
 */
export function useCan(props?: UseCanProps): boolean {
  if (!props) return true;
  const { has, hasAny, hasAll } = props;

  if (!has && !hasAny && !hasAll) return true;

  return true;
}
