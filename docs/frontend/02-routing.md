# Routing

## Overview

The app uses **TanStack Router v1** with **TanStack Virtual File Routes**. Routes are defined in code (not by filesystem scanning) and the Vite plugin generates the typed `routeTree.gen.ts` at build/dev time.

## Route Tree Definition

All routes are wired in `src/views/modules/routes.ts`:

```ts
import {layout, rootRoute} from '@tanstack/virtual-file-routes';
// ... module route imports

// All authenticated pages live inside the StackedLayout wrapper
const stackedLayoutRoutes = layout('stackedLayout', '../layouts/StackedLayout/index.tsx', [
  featureARoutes,
  featureBRoutes,
  featureCRoutes,
  userProfileRoutes,
  // ... all authenticated feature modules
]);

export const routes = rootRoute('../root.tsx', [stackedLayoutRoutes, authRoutes, rootRoutes]);
```

### Helper Functions

```ts
// Builds file paths for layouts and pages inside a module
export function filePathLayout(module: string): string {
  return `${module}/layout.tsx`;
}

export function filePath(module: string, page: string): string {
  return `${module}/pages/${page}/index.tsx`;
}
```

## Module Route Files

Each module defines its own routes in `pages/routes.ts`:

```ts
// modules/feature-a/pages/routes.ts
import type {VirtualRouteNode} from '@tanstack/virtual-file-routes';
import {index, route} from '@tanstack/virtual-file-routes';
import {filePath, filePathLayout} from '../../routes';

const MODULE_NAME = 'feature-a';

export const featureARoutes: VirtualRouteNode = route('/items', filePathLayout(MODULE_NAME), [
  index(filePath(MODULE_NAME, 'ListPage')),
  route('new', filePath(MODULE_NAME, 'NewPage')),
  route('$id/edit', filePath(MODULE_NAME, 'EditPage')),
]);
```

Auth routes use an underscore-prefixed layout key:

```ts
// modules/auth/pages/routes.ts
export const authRoutes: VirtualRouteNode = route('/_auth', filePathLayout('auth'), [
  route('signin', filePath('auth', 'SignInPage')),
]);
```

## URL Structure Pattern

| URL pattern | Layout | Notes |
|-------------|--------|-------|
| `/` | root | Redirect only — no UI |
| `/signin` | `_auth` (AuthLayout) | Unauthenticated |
| `/dashboard` | `_stackedLayout` (StackedLayout) | Authenticated |
| `/items` | `_stackedLayout` | List page |
| `/items/new` | `_stackedLayout` | Create page |
| `/items/$id/edit` | `_stackedLayout` | Edit page with dynamic param |
| `/user-profile` | `_stackedLayout` | Current user profile |

Dynamic params use the `$paramName` convention (e.g., `$id`).

## Creating a Route (Page Component)

Each page file exports a `Route` object and a named component:

```tsx
import {z} from 'zod';
import {createFileRoute} from '@tanstack/react-router';

// 1. URL search param schema (validates and types query string)
const listSearchSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(10),
  sortKey: z.nativeEnum(SortKeyEnum).optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
  name: z.string().optional(),
});

export const Route = createFileRoute('/_stackedLayout/items/')({
  validateSearch: listSearchSchema,           // parse + validate URL search params
  loaderDeps: ({search}) => search,           // re-run loader when search changes
  loader: ({context: {queryClient}, deps}) => // preload query before component mounts
    queryClient.ensureQueryData(getListItemsSuspenseQueryOptions(deps)),
  pendingComponent: LoadingPage,             // shown during loader
  component: ListPage,                       // main component
});

export function ListPage() {
  const search = Route.useSearch();          // typed search params
  const navigate = Route.useNavigate();      // typed navigation
  // ...
}

// Skeleton shown while the route loader runs
export function LoadingPage() {
  return <Page title="..."><TableSkeleton /></Page>;
}
```

## Route Guards (`beforeLoad`)

Guards run before the loader and before the component mounts.

### Root redirect (`/`)
```ts
export const Route = createFileRoute('/')({
  beforeLoad: ({context}) => {
    if (context?.auth) {
      redirect({to: '/dashboard'});
    }
    throw redirect({to: '/signin'});
  },
});
```

### Protected layout — redirect unauthenticated users
```ts
export const Route = createFileRoute('/_stackedLayout')({
  beforeLoad: ({context, location}) => {
    if (!context?.auth) {
      throw redirect({
        to: '/signin',
        search: {redirect: location.pathname},  // preserve destination URL
      });
    }
  },
});
```

### Auth pages — redirect already authenticated users
```ts
export const Route = createFileRoute('/_auth/signin')({
  validateSearch: (search): {redirect?: string} => ({
    redirect: z.string().optional().parse(search.redirect),
  }),
  beforeLoad: ({search, context}) => {
    if (context?.auth) {
      throw redirect({to: search?.redirect ?? '/dashboard'});
    }
  },
  component: SignInPage,
});
```

## Router Context

The router receives typed context available in all guards and loaders:

```ts
// App.tsx
export const router = createRouter({
  routeTree,
  context: {
    queryClient,          // shared React Query client
    auth: undefined!,     // boolean — injected from Zustand via RouterProvider
  },
  defaultPreload: 'intent',       // preload on hover/focus
  defaultPreloadStaleTime: 0,     // loaders always re-run on preload
  defaultErrorComponent: ({error, reset}) => <ErrorPage error={error} reset={reset} />,
  defaultNotFoundComponent: () => <NotFoundPage />,
  defaultPendingComponent: () => <AppLoader />,
});

// RouterProvider injects the auth flag from the store
<RouterProvider router={router} context={{auth}} />
```

## Search Params as State (URL-driven filters)

Filters, pagination, and sorting are stored in URL search params — not in component state. This gives free browser back/forward navigation and shareable URLs.

```ts
const navigate = Route.useNavigate();

// Apply a filter — always reset to page 1
await navigate({
  search: (prev) => ({
    ...prev,
    page: 1,
    name: filterValue,
  }),
});

// Change page
await navigate({
  search: (prev) => ({...prev, page: newPage}),
});
```

## Breadcrumbs via `beforeLoad`

Pages declare their breadcrumb label via `beforeLoad` return value:

```ts
export const Route = createFileRoute('/_stackedLayout/items/new')({
  beforeLoad: (): BreadcrumbContext => ({breadcrumb: 'items.new'}),
  component: NewPage,
});
```

## Loader Pattern

Loaders call `queryClient.ensureQueryData(...)` to pre-populate the React Query cache before the component renders:
- First visit: fetches data → shows `pendingComponent`
- Revisit with hot cache: renders instantly
- `defaultPreloadStaleTime: 0` forces loaders to re-run on `'intent'` preload

```ts
loader: ({context: {queryClient}, deps}) =>
  queryClient.ensureQueryData(getListItemsSuspenseQueryOptions(deps)),
```

The shared layout loader sets longer stale times for data that rarely changes (e.g., current user, permissions):

```ts
// StackedLayout loader
loader: ({context: {queryClient}}) => {
  queryClient.setQueryDefaults(getCurrentCompanyQueryKey(), {staleTime: 60 * 60 * 1000}); // 1h
  queryClient.setQueryDefaults(getUserPermissionsQueryKey(), {staleTime: 5 * 60 * 1000}); // 5m
},
```
