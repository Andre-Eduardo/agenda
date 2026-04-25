# Frontend Documentation — Automo Web App

> This documentation was generated to guide AI agents in recreating an equivalent frontend in a new application. It covers architecture decisions, patterns, and integration points of the `apps/web` package.

## Document Index

| # | File | Description |
|---|------|-------------|
| 01 | [architecture.md](./01-architecture.md) | Tech stack, directory structure, build configuration |
| 02 | [routing.md](./02-routing.md) | TanStack Router, virtual file routes, route guards |
| 03 | [auth.md](./03-auth.md) | Authentication flow, authorization, permissions |
| 04 | [state-management.md](./04-state-management.md) | Zustand (UI state) + React Query (server state) |
| 05 | [api-integration.md](./05-api-integration.md) | API client, Orval codegen, Axios, WebSocket |
| 06 | [component-patterns.md](./06-component-patterns.md) | Component structure, layouts, naming conventions |
| 07 | [styling.md](./07-styling.md) | Tailwind CSS v4, CSS variable tokens, shadcn/ui, dark mode |
| DS | [design-system.md](./design-system.md) | Color tokens, typography, spacing, clinical patterns, globals.css |
| 08 | [forms.md](./08-forms.md) | React Hook Form + Zod validation patterns |
| 09 | [i18n.md](./09-i18n.md) | Internationalization with i18next (3 languages) |
| 10 | [packages.md](./10-packages.md) | Workspace packages: @automo/client, @automo/value-objects |

## Quick Reference

- **Framework**: React 19 + TypeScript 6 + Vite 6 (SWC)
- **Router**: TanStack Router v1 (virtual file routes + auto-generated route tree)
- **Server state**: TanStack React Query v5
- **UI state**: Zustand v5 (persisted to localStorage)
- **UI components**: shadcn/ui + Radix UI (source in `src/components/ui/`) + Lucide Icons
- **CSS**: Tailwind CSS v4 — tokens via CSS variables in `src/app/globals.css`
- **API client**: Auto-generated from OpenAPI via Orval (`@automo/client`)
- **Forms**: React Hook Form + Zod
- **i18n**: i18next with 3 locales: `pt-BR`, `en-US`, `es-ES`
- **Auth**: Cookie-based sessions (`withCredentials: true`), permission strings like `"entity:action"`
- **Styling**: Token-based design system (`globals.css`) with `dark` class mode, Tailwind utilities, `cn()` helper

## Key Architectural Decisions

1. **Vertical slice modules** — features live in `src/views/modules/{module}/` and own their pages, components, and translations.
2. **Routes are code, not filesystem** — TanStack Virtual File Routes define the route tree in `src/views/modules/routes.ts`; Vite plugin generates `routeTree.gen.ts`.
3. **Route loaders preload queries** — each route's `loader` calls `queryClient.ensureQueryData(...)` so data is ready before the component mounts.
4. **Permissions are server-driven** — the sidebar, action buttons, and form actions all check backend permissions fetched at `/api/v1/auth/permissions`.
5. **Forms are ref-controlled** — complex forms expose a `{ submit }` ref handle so parent pages (not the form itself) control submission and navigation.
6. **Code generation is the API contract** — never write API call code by hand; Orval generates all hooks from the OpenAPI spec.
