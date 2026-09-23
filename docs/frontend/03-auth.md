# Authentication & Authorization

## Authentication

### Mechanism

Authentication uses **HTTP-only cookies** managed by the server. The Axios client is configured with `withCredentials: true` so cookies are sent on every request automatically. There is no JWT stored in localStorage.

The Zustand `appStore` keeps a **boolean `auth` flag** in localStorage that acts as a client-side signal (not a security check) of whether the user has an active session.

### Sign-In Flow

```
User submits form
  → useSignIn() mutation → POST /api/v1/auth/sign-in
  → 200 OK (server sets HTTP-only session cookie)
  → setAuth(true)              // update Zustand flag
  → router.invalidate()        // re-run all active loaders
  → queryClient.clear()        // clear any stale pre-auth cache
  → navigate to /dashboard (or the redirect param from URL)
```

```tsx
const {mutate: signIn, isPending} = useSignIn({
  mutation: {
    onSuccess: async () => {
      setAuth(true);
      await router.invalidate();
      queryClient.clear();
      await navigate({to: search?.redirect ?? '/dashboard', replace: true});
    },
    onError: (error) => {
      if (error.status === 403) {
        setError('username', {message: t('validation.username.error.invalid')});
        setError('password', {message: t('validation.password.error.invalid')});
      }
    },
  },
});
```

### Sign-Out Flow

```
User clicks logout
  → useSignOut() mutation → POST /api/v1/auth/sign-out
  → setAuth(false)
  → router.invalidate()
  → navigate to /signin
```

```tsx
const {mutate: signOut} = useSignOut({
  mutation: {
    onSuccess: async () => {
      setAuth(false);
      await router.invalidate();
      await navigate({to: '/signin'});
    },
  },
});
```

### Auth State Storage

```ts
// src/store/appStore.ts
export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      auth: false,        // persisted to localStorage ('app-storage' key)
      // ...other UI state
      setAuth: (auth) => set({auth}),
    }),
    { name: 'app-storage' }
  )
);
```

The `auth` flag is injected into the TanStack Router context:
```tsx
// App.tsx
<RouterProvider router={router} context={{auth}} />
```

Route guards then read `context.auth` in `beforeLoad`.

---

## Authorization

### Permission Model

Permissions are strings in the format **`"resource:action"`**, fetched from the API and cached in React Query.

```
entity:view
entity:create
entity:update
entity:delete
entity:view-own          // scoped — user sees only their own records
feature:action           // generic feature-action pair
```

Any combination of resource and action can be defined. The format is always `"resource:action"`.

### `useCan` Hook

```ts
// src/hooks/useCan.tsx
export type UseCanProps = {
  has?: Permission;          // must have exactly this permission
  hasAny?: Permission[];     // must have at least one
  hasAll?: Permission[];     // must have all of them
};

export function useCan(props?: UseCanProps): boolean;          // just the answer
export function useCanState(props?: UseCanProps): CanState;    // {allowed, isLoading, isError}
```

Permissions come from `GET /api/v1/clinic-members/me/permissions` (generated hook
`useGetCurrentClinicMemberPermissions`), calculated by the server for the active clinic member; the
response is `{permissions: string[]}`. See [rbac-permissions-endpoint.md](../rbac-permissions-endpoint.md)
and the role matrix in [rbac-matrix.md](../rbac-matrix.md).

Rules:

- **Lazy.** The request is only made when a call passes `has`, `hasAny` or `hasAll`. With none of them
  the answer is `true` and nothing is fetched.
- **Fail closed.** While permissions load, or if the request fails and nothing is cached,
  `allowed` is `false`, so a gated action is neither shown nor actionable. `useCanState` exposes
  `isLoading` and `isError` when the UI must tell those cases apart.
- **Last known permissions win.** If a background refetch fails after a successful fetch, the cached
  list keeps being used.
- **All conditions hold.** When more than one of `has`, `hasAny` and `hasAll` is given, every one of them
  must be satisfied. An empty `hasAny` never matches.
- **UI only.** This shapes the interface. The server is the authority and answers 403 to a forbidden
  action, whatever the client shows.
- **Session errors.** A 401 is rethrown by the global `QueryErrorHandler` like any other query; a 403 or
  network error only denies.

### `Can` Component

Wraps `useCan` with two usage patterns:

**Render prop** (most flexible — passes the boolean to children):
```tsx
<Can has="entity:create">
  {(allowed) => (
    <Button disabled={!allowed} disabledHint={{title: 'Permission denied'}}>
      Create
    </Button>
  )}
</Can>
```

**Conditional render** (show/hide completely):
```tsx
<Can has="entity:delete" granted={<DeleteButton />} denied={null} />
```

**`hasAny` / `hasAll`**:
```tsx
<Can hasAny={['entity:create', 'entity:update']}>
  {(allowed) => allowed ? <EditActions /> : null}
</Can>
```

### Permission-Gated Actions

Common integration points:

```tsx
// Form action button with built-in permission check
<FormActions
  isDirty={isDirty}
  onSubmit={handleSubmit}
  submitPermission="entity:create"
/>

// Delete modal with built-in permission check
<DeleteItemModal
  permission="entity:delete"
  onConfirm={() => handleDelete(id)}
  // ...
/>
```

### Sidebar Navigation Filtering

Sidebar items can declare an optional `permission` field. Items without the required permission are hidden entirely. If all children of a group are hidden, the group itself is hidden.

```ts
const navItems = [
  {
    href: '/items',
    label: t('navigation.items'),
    key: 'items',
    permission: 'entity:view',   // hidden if user lacks this
  },
  {
    label: t('navigation.group'),
    key: 'group',
    children: [
      {href: '/a', label: '...', key: 'a', permission: 'a:view'},
      {href: '/b', label: '...', key: 'b', permission: 'b:view'},
    ],
  },
];
```

Filtering logic:
```tsx
const filtered = navItems.flatMap(item => {
  if (item.permission && !userPermissions.includes(item.permission)) {
    return [];  // exclude item
  }
  if ('children' in item) {
    const children = filter(item.children);
    if (children.length === 0) return [];  // hide empty groups
    return [{...item, children}];
  }
  return [item];
});
```

### Permission Caching

`useCanState` sets a 5-minute `staleTime` on the permissions query, so the many `useCan`/`<Can>` calls on
a page share one cached request. Sign-in clears the query cache (`queryClient.clear()`), so a new session
never reuses the previous user's permissions.

---

## Multi-Company / Multi-Tenant Support

The app supports multiple company contexts per user. The active company is managed server-side via cookie. Switching companies invalidates all queries:

```tsx
const {mutate: switchCompany} = useSwitchCompany({
  mutation: {
    onSuccess: async () => {
      await queryClient.invalidateQueries(); // clear everything on context switch
    },
  },
});
```

The company selector lives in the sidebar footer section.
