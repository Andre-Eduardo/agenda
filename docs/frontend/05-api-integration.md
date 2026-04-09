# API Integration

## Overview

All API interaction is handled through a dedicated **workspace API client package** (e.g., `@app/client`) that is entirely **auto-generated from the OpenAPI specification using [Orval](https://orval.dev/)**. API call code is never written by hand in `apps/web`.

The generated package provides:
- TypeScript types for all request/response models
- Axios-based service functions
- TanStack React Query hooks (queries + mutations)
- MSW mock handlers for testing
- Faker-based mock data factories

---

## HTTP Client Configuration

The generated Axios instance is configured in the client package:
- **Base URL**: `VITE_API_URL` env variable (optional fallback for same-origin deploys)
- **withCredentials**: `true` — sends the session cookie on every request (required for auth)
- **API prefix**: `/api/v1/`

---

## Using Generated Hooks

### Queries

```ts
import {useListItems, useListItemsSuspense} from '@app/client';

// Standard — data may be undefined while loading
const {data, isLoading, error} = useListItems({pagination: {page: 1, limit: 10}});

// Suspense variant — data is always defined; throws to Suspense boundary while loading
const {data} = useListItemsSuspense({pagination: {page: 1, limit: 10}});
```

### Mutations

```ts
import {useCreateItem, useDeleteItem, getListItemsQueryKey} from '@app/client';

const {mutate: createItem, isPending} = useCreateItem({
  mutation: {
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: getListItemsQueryKey()});
      notify({title: 'Created!', appearance: 'positive'});
      await navigate({to: '/items'});
    },
  },
});

// Trigger the mutation
createItem({data: formValues});
```

### Query Options (for route loaders)

Each query exposes an options factory for use in TanStack Router loaders:

```ts
import {getListItemsSuspenseQueryOptions} from '@app/client';

loader: ({context: {queryClient}, deps}) =>
  queryClient.ensureQueryData(getListItemsSuspenseQueryOptions(deps)),
```

### Query Key Factories

```ts
import {getListItemsQueryKey, getGetItemQueryKey} from '@app/client';

// Invalidate all list queries (any params)
await queryClient.invalidateQueries({queryKey: getListItemsQueryKey()});

// Invalidate a specific item
await queryClient.invalidateQueries({queryKey: getGetItemQueryKey(itemId)});
```

---

## Services Structure

For each resource in the OpenAPI spec, Orval generates a consistent set of exports:

| Export type | Example |
|-------------|---------|
| Query hook | `useListItems`, `useGetItem` |
| Suspense query hook | `useListItemsSuspense`, `useGetItemSuspense` |
| Mutation hook | `useCreateItem`, `useUpdateItem`, `useDeleteItem` |
| Query key factory | `getListItemsQueryKey`, `getGetItemQueryKey` |
| Query options factory | `getListItemsSuspenseQueryOptions` |
| TypeScript types | `Item`, `ListItemsParams`, `CreateItemDto` |
| Enums | `ItemSortKey`, `ItemStatus` |
| MSW handlers | `itemHandlers` (for tests) |
| Mock factories | `createItemMock()` (Faker-based) |

---

## Auth Services

Auth endpoints follow the same pattern but are not resource-specific:

```ts
import {useSignIn, useSignOut, useGetUserPermissions} from '@app/client';
import {getUserPermissionsQueryKey} from '@app/client';
```

---

## Error Handling

API errors follow a standard problem shape:

```ts
type ApiProblem = {
  title: string;
  detail: string;
  status: number;     // HTTP status code
  instance: string;   // request URI
};
```

**In mutations** — handle inline:
```ts
onError: (error) => {
  if (error.status === 403) { /* handle forbidden */ }
  if (error.status === 422) { /* handle validation error */ }
}
```

**Globally** — `<QueryErrorHandler />` catches unhandled query errors and displays a notification without crashing the page.

---

## WebSocket Integration

The client package exports a singleton WebSocket service for real-time updates:

```ts
import {webSocketService} from '@app/client/websocket';

// Connect after sign-in (pass tenant/company context)
webSocketService.connect(companyId);

// Disconnect on sign-out
webSocketService.disconnect();
```

Uses `socket.io-client` with `withCredentials: true` and path `/api/socket.io`. Reconnects automatically.

---

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `VITE_API_URL` | Full API base URL | Same-origin (relative paths) |
| `VITE_API_PORT` | Alternative: port only (nginx proxy setup) | `3000` |

In production with a reverse proxy, the API and frontend are served from the same origin — no explicit `VITE_API_URL` is needed.

---

## Code Generation Workflow (Orval)

When the OpenAPI spec changes:
1. Update the spec in the client package
2. Run the Orval codegen script
3. The following are regenerated per service:
   - `{service}.ts` — hooks, types, Axios functions
   - `{service}.msw.ts` — MSW request handlers (for tests)
   - `{service}.mock.ts` — Faker data factories (for tests)
4. **Never manually edit generated files** — changes will be overwritten on the next run

---

## Import Paths

```ts
// Types
import type {Item, ListItemsParams, Permission} from '@app/client';

// Hooks
import {useListItems, useCreateItem, getListItemsQueryKey} from '@app/client';

// Query options (for loaders)
import {getListItemsSuspenseQueryOptions} from '@app/client';

// WebSocket
import {webSocketService} from '@app/client/websocket';
```
