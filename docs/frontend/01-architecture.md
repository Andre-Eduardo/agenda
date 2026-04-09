# Architecture Overview

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| UI Framework | React | 19.2.0 |
| Language | TypeScript | 6.0.2 |
| Build Tool | Vite + SWC | 6.4.0 |
| Router | TanStack Router | 1.125.6 |
| Server State | TanStack React Query | 5.71.10 |
| UI State | Zustand | 5.0.5 |
| UI Component Library | `@ecxus/ui` | 0.0.2-rc.124 |
| Forms | React Hook Form | 7.66.1 |
| Validation | Zod | 3.24.2 |
| i18n | i18next + react-i18next | 24.x / 15.x |
| Date utils | date-fns | 4.1.0 |
| Animation | motion | 12.x |
| API Client | `@automo/client` (workspace, Orval-generated) | — |
| Shared models | `@automo/value-objects` (workspace) | — |
| Code quality | Oxlint + Oxfmt | 1.56.0 / 0.41.0 |

## Directory Structure

```
apps/web/
├── vite.config.ts               # Vite config: TanStack Router plugin, SWC, path aliases
├── tsconfig.json                # TypeScript config (extends root, path alias @/ → src/)
├── package.json                 # Dependencies (see below)
└── src/
    ├── main.tsx                 # DOM entry point — mounts <App />
    ├── App.tsx                  # Root component — wires all providers
    ├── routeTree.gen.ts         # AUTO-GENERATED — do not edit manually
    ├── hooks/                   # App-level custom hooks (useCan, useFileUpload, ...)
    ├── store/                   # Zustand stores (appStore, devtoolsStore)
    ├── styles/                  # Theme color definitions (lightMode.ts, darkMode.ts)
    ├── translations/            # i18n setup + locale JSON files
    │   ├── i18n.ts             # i18next instance configuration
    │   ├── pt-BR/              # Portuguese (default) translation namespaces
    │   ├── en-US/              # English translation namespaces
    │   └── es-ES/              # Spanish translation namespaces
    ├── utils/                   # Utilities: constants, date, string, validation helpers
    └── views/
        ├── components/          # Shared reusable components (Can, Page, Skeletons, ...)
        ├── layouts/             # Layout wrappers
        │   ├── AuthLayout/      # Wrapper for unauthenticated pages (sign-in)
        │   └── StackedLayout/   # Main app shell with sidebar navigation
        ├── pages/               # Standalone pages (ErrorPage, NotFoundPage)
        ├── root.tsx             # Root TanStack Router layout
        └── modules/             # Feature modules (vertical slices)
            ├── routes.ts        # Central route tree definition (virtual file routes)
            ├── translations.ts  # Module-level translation keys
            ├── colors.ts        # Shared color references across modules
            ├── auth/            # Authentication (sign-in)
            ├── {feature-a}/     # One directory per feature domain
            ├── {feature-b}/
            ├── {feature-c}/
            └── user-profile/    # Always present: current user profile
```

## Module Structure (Vertical Slices)

Each feature module follows this internal structure:

```
modules/{module}/
├── layout.tsx                  # Module layout (nested route shell if needed)
├── pages/
│   ├── routes.ts               # Route definitions for this module
│   └── {PageName}/
│       ├── index.tsx           # Page component + Route definition
│       ├── styles.ts           # CSS-in-JS style objects for this page
│       ├── translations.ts     # Translation key constants (namespace prefix)
│       └── index.test.tsx      # Page tests
└── components/
    └── {ComponentName}/
        ├── index.tsx           # Component implementation
        ├── styles.ts           # CSS-in-JS style objects
        ├── translations.ts     # Translation key constants
        └── index.test.tsx      # Component tests
```

## Provider Tree (`App.tsx`)

The provider hierarchy from outermost to innermost:

```tsx
<ThemeProvider colorModes={...} i18n={i18nInstance}>
  <QueryClientProvider client={queryClient}>
    <QueryErrorHandler />          {/* global React Query error boundary */}
    <SidebarProvider>
      <RouterProvider router={router} context={{auth}} />
    </SidebarProvider>
  </QueryClientProvider>
</ThemeProvider>
```

Key points:
- `ThemeProvider` (from the UI library) owns theme switching and i18n integration.
- `QueryErrorHandler` sits here to catch unhandled query errors globally.
- `RouterProvider` receives `auth` from Zustand as router context so route guards can check it.

## Vite Configuration

```ts
// vite.config.ts
plugins: [
  tsconfigPaths(),             // resolves @/ path alias from tsconfig
  tanstackRouter({
    virtualRouteConfig: routes, // routes from src/views/modules/routes.ts
    routesDirectory: 'src/views/modules',
    autoCodeSplitting: true,   // each route is code-split automatically
  }),
  react(),                     // SWC-based React transform
]
```

`autoCodeSplitting: true` means every page gets its own chunk — no manual `lazy()` needed.

## React Query Global Config

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,      // 30 seconds
      gcTime: 5 * 60 * 1000,     // 5 minutes
    },
  },
});
```

Router preload strategy is `'intent'` (preloads on hover/focus) with `defaultPreloadStaleTime: 0` so loaders always re-run on preload.

## TypeScript Path Aliases

```json
// tsconfig.json
"paths": {
  "@/*": ["./src/*"]
}
```

Workspace packages are referenced directly in `package.json` and resolved as TypeScript project references:
- `@automo/client` → `packages/client`
- `@automo/value-objects` → `packages/value-objects`
