# Task Completion Checklist — Automo / Agenda

After making code changes, always run the relevant checks:

## Backend changes
1. `pnpm -F @agenda-app/server lint` — check for lint/format issues
2. `pnpm -F @agenda-app/server test` — run unit tests
3. If API shape changed:
   - `pnpm -F @agenda-app/server openapi:generate` — regenerate openapi.json
   - `pnpm -F @agenda-app/client generate` — regenerate Orval client
4. For DB schema changes: `pnpm -F @agenda-app/server prisma:migrate:create` then `prisma:migrate`
5. Optionally run integration tests: `pnpm -F @agenda-app/server test:integration`

## Frontend changes
1. `pnpm -F @agenda-app/app typecheck` — TypeScript check
2. `pnpm -F @agenda-app/app lint` — lint check

## Full project
1. `pnpm run typecheck` — typecheck all packages
2. `pnpm run lint` — lint all packages
3. `pnpm run build` — production build

## Before committing
- No `as` casts in `src/` (server) outside test files
- All Prisma enum conversions use `toEnum` / `toEnumOrNull` / `toEnumArray`
- No manual API calls in frontend (use generated client)
- Multi-tenant: repository queries filter by `professionalId`
- Lint passes: `pnpm run lint`
- Types pass: `pnpm run typecheck`
