# Code Style & Conventions — Automo / Agenda

## Language
- **TypeScript** everywhere (strict mode). Server: TS 5.8. Web: TS 6.
- `pt-BR` naming for domain concepts in comments/docs; code uses English identifiers.

## Linting / Formatting
- **oxlint** for linting (NOT eslint)
- **oxfmt** for formatting (NOT prettier)
- Run: `pnpm lint` or `pnpm lint:fix`

## Backend (NestJS / Clean Architecture / DDD)

### Type Safety — CRITICAL
- **Zero casts (`as`) in `src/`** outside `__tests__/`
- For Prisma enum → domain enum conversions, always use helpers:
  ```typescript
  import { toEnum, toEnumOrNull, toEnumArray } from '@domain/@shared/utils';
  ```
- No `any` types; no unsafe casts.
- Details: `docs/type-safety-patterns.md`

### Architecture Layers
- `domain/` — Entities, value objects, repository interfaces, domain events. Pure business logic, no framework deps.
- `application/` — Use cases, commands (extends `BaseApplicationService`), mappers, DTOs.
- `infrastructure/` — Prisma repositories, NestJS modules, HTTP controllers, external services.

### Patterns
- Use `BaseApplicationService` + `Command` pattern for use cases (see `docs/service-patterns.md`)
- Mappers convert between Prisma models ↔ domain entities ↔ DTOs
- DTOs validated with Zod or class-validator (OpenAPI via `@asteasolutions/zod-to-openapi`)
- Multi-tenant: every repository query MUST filter by `professionalId` (from Actor context)
- Integration tests: BDD/Cucumber.js, isolated DB `test_integration_agenda`, `contextId` for parallel isolation

### Naming
- Classes: PascalCase
- Methods/variables: camelCase
- Files: kebab-case
- See `docs/backend-style-guide.md` for full conventions

## Frontend (React / Vite)

### API Calls
- **Never write API calls manually** — always use the Orval-generated client from `packages/client`
- Hooks follow React Query v5 patterns (`useQuery`, `useMutation`)

### Routing
- TanStack Router v1 with file-based route generation (`routeTree.gen.ts` — do not edit manually)
- See `docs/frontend/` for routing, auth, state, forms, i18n patterns

### State Management
- Zustand v5 for global state (`src/store/`)
- React Query for server state

### Forms
- React Hook Form + Zod for validation

### i18n
- i18next; default locale `pt-BR`; also `en-US`, `es-ES`
- Translation files in `src/translations/`

### Components
- shadcn/ui components over Radix UI primitives
- Tailwind CSS v4 for styling
