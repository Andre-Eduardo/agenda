# Suggested Commands — Automo / Agenda

## Shell Note
Project is at `E:\agenda` on Windows but the shell is Git Bash, so use `/e/agenda` or just work from the project root (the shell CWD is already `/e/agenda`).

## Root-level commands
```bash
pnpm install                     # Install all dependencies
pnpm run start:dev               # Start server + web in parallel (concurrently)
pnpm run typecheck               # TypeScript check across all packages
pnpm run build                   # Build all packages
pnpm run lint                    # Lint all packages (oxlint + oxfmt)
pnpm run lint:fix                # Auto-fix lint issues
pnpm run code-check              # Full code check (type-check + lint)
pnpm run generate:client         # Regenerate OpenAPI + Orval client
```

## Backend (apps/server)
```bash
pnpm -F @agenda-app/server start:dev          # Dev with watch (hot-reload)
pnpm -F @agenda-app/server start:dev:full     # Start DB + dev server
pnpm -F @agenda-app/server test               # Unit tests (Jest)
pnpm -F @agenda-app/server test:integration   # BDD integration tests (Cucumber.js)
pnpm -F @agenda-app/server lint               # Lint backend
pnpm -F @agenda-app/server lint:fix           # Fix lint issues
pnpm -F @agenda-app/server openapi:generate   # Generate openapi.json
pnpm -F @agenda-app/server prisma:generate    # Generate Prisma client
pnpm -F @agenda-app/server prisma:migrate     # Apply migrations
pnpm -F @agenda-app/server prisma:migrate:create  # Create new migration
pnpm -F @agenda-app/server prisma:migrate:reset   # Reset DB (dev only)
pnpm -F @agenda-app/server prisma:seed        # Seed the database
```

## Frontend (apps/web)
```bash
pnpm -F @agenda-app/app dev          # Vite dev server
pnpm -F @agenda-app/app build        # Production build
pnpm -F @agenda-app/app typecheck    # Type check
pnpm -F @agenda-app/app lint         # Lint frontend
pnpm -F @agenda-app/app storybook    # Storybook dev (port 6006)
```

## Packages
```bash
pnpm -F @agenda-app/client generate           # Regenerate Orval hooks (requires openapi.json)
pnpm -F @agenda-app/client build
pnpm -F @agenda-app/value-objects build
```

## Code generation flow (when API changes)
1. `pnpm -F @agenda-app/server openapi:generate`   → updates apps/server/openapi.json
2. `pnpm -F @agenda-app/client generate`            → regenerates React Query hooks in packages/client
**Never write API calls manually in the frontend — always use the generated client.**

## Database
```bash
pnpm -F @agenda-app/server start:database    # docker compose up postgres
pnpm -F @agenda-app/server stop:environment  # docker compose down --volumes
```

## Windows utility commands (Git Bash)
```bash
ls, cat, grep, find   # Unix-style work in Git Bash
git status / git log  # Standard git
```
