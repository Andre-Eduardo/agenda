# State Management

The app uses two complementary state management libraries:

| Concern | Library | Persistence |
|---------|---------|-------------|
| UI / client state | **Zustand** | localStorage |
| Server / remote state | **TanStack React Query** | In-memory (cache) |

The rule: if data comes from the API, it belongs in React Query. If it's purely UI (theme, sidebar, session flag), it belongs in Zustand.

---

## Zustand — Client State

### `useAppStore`

The main application store, persisted to `localStorage` under the key `'app-storage'`.

```ts
// src/store/appStore.ts
export type AppStore = {
  auth: boolean;
  colorMode: 'light' | 'dark';
  sidebarCollapsed: boolean;
  language: 'pt-BR' | 'en-US' | 'es-ES';

  setAuth: (auth: boolean) => void;
  setColorMode: (mode: 'light' | 'dark') => void;
  setSidebarCollapsed: () => void;   // toggles the boolean
  setLanguage: (language: string) => void;
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      colorMode: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      auth: false,
      sidebarCollapsed: false,
      language: /* navigator.language if supported, else fallback */,
      setColorMode: (mode) => set({colorMode: mode}),
      setSidebarCollapsed: () => set({sidebarCollapsed: !get().sidebarCollapsed}),
      setAuth: (auth) => set({auth}),
      setLanguage: (language) => set({language}),
    }),
    { name: 'app-storage' }
  )
);
```

**Usage patterns:**

Single selector:
```tsx
const colorMode = useAppStore((state) => state.colorMode);
```

Multiple values (shallow equality to avoid unnecessary re-renders):
```tsx
import {useShallow} from 'zustand/shallow';

const [auth, colorMode, setColorMode] = useAppStore(
  useShallow((state) => [state.auth, state.colorMode, state.setColorMode])
);
```

Outside React (e.g., during i18n initialization):
```ts
const language = useAppStore.getState().language;
```

### `useDevtoolsStore`

Lightweight store to toggle the React Query / Router devtools panels (activated via a UI gesture):

```ts
export const useDevtoolsStore = create<DevtoolsStore>()((set, get) => ({
  showDevtools: false,
  toggleDevtools: () => set({showDevtools: !get().showDevtools}),
}));
```

---

## React Query — Server State

### Query Client Configuration

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,   // data is fresh for 30 seconds
      gcTime: 5 * 60 * 1000,  // unused cache entries removed after 5 minutes
    },
  },
});
```

### Data Fetching Hooks

All query hooks come from the generated API client package. Two variants exist per endpoint:

```ts
// Standard — data may be undefined while loading
const {data, isLoading} = useListItems(params);

// Suspense variant — data is always defined (throws to boundary while loading)
const {data} = useListItemsSuspense(params);
```

Prefer Suspense hooks inside routes that define a `pendingComponent`. The loader pre-populates the cache, so Suspense resolves instantly on first render.

### Route Loaders + React Query (canonical pattern)

```ts
export const Route = createFileRoute('/_stackedLayout/items/')({
  loaderDeps: ({search}) => search,
  loader: ({context: {queryClient}, deps}) =>
    queryClient.ensureQueryData(getListItemsSuspenseQueryOptions(deps)),
  pendingComponent: LoadingPage,
  component: ListPage,
});

export function ListPage() {
  const {data} = useListItemsSuspense(queryArgs); // cache is hot, no loading state
  // ...
}
```

### Mutations

```ts
const {mutateAsync: deleteItem} = useDeleteItem({
  mutation: {
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: getListItemsQueryKey()});
    },
  },
});
```

Using `useTransition` for non-blocking async operations:
```tsx
const [loading, startTransition] = useTransition();

const handleDelete = (id: string) => {
  startTransition(async () => {
    await deleteItem({id});
  });
};
```

### Conditional Fetching

```ts
// Only fetch when a check is actually needed
const {data} = useGetUserPermissions({query: {enabled: !!permissionToCheck}});
```

### Cache Invalidation Patterns

| Event | Invalidation |
|-------|-------------|
| Create / delete entity | `queryClient.invalidateQueries({queryKey: getListItemsQueryKey()})` |
| Update entity | Same, or `setQueryData` for optimistic updates |
| Switch company / tenant | `queryClient.invalidateQueries()` — invalidate everything |
| Sign in | `queryClient.clear()` — clear all pre-auth cached data |

### Query Key Factories

Each generated service exports stable key factories. Always use them (not inline arrays) to ensure invalidations match subscriptions:

```ts
getListItemsQueryKey(params?)     // list queries
getGetItemQueryKey(id)            // single-entity queries
getUserPermissionsQueryKey()      // permissions
getCurrentCompanyQueryKey()       // current company/tenant
```

### Custom Stale Times

The shared layout loader overrides stale time for data that rarely changes:

```ts
loader: ({context: {queryClient}}) => {
  queryClient.setQueryDefaults(getCurrentCompanyQueryKey(), {staleTime: 60 * 60 * 1000}); // 1h
  queryClient.setQueryDefaults(getUserPermissionsQueryKey(), {staleTime: 5 * 60 * 1000}); // 5m
},
```

### Global Error Handling

`<QueryErrorHandler />` is mounted at the top of the tree (inside `QueryClientProvider`) and catches any unhandled query error. The router adds a second layer via:

```ts
defaultErrorComponent: ({error, reset}) => <ErrorPage error={error} reset={reset} />
```
