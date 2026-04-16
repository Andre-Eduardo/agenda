---
name: prisma-migrate
description: Create and apply Prisma database migrations
user_invocable: true
---

# Prisma Migration

Create or apply Prisma database migrations.

## Arguments

- `create <name>` — create a new migration with the given name
- `apply` — apply pending migrations
- `status` — check migration status
- No argument — apply pending migrations

## Steps

### Create a new migration
1. Ensure the Prisma schema at `apps/server/prisma/schema.prisma` has the desired changes
2. Run:
   ```bash
   pnpm -F @automo/server prisma:migrate:create --name <migration_name>
   ```
3. Review the generated SQL in `apps/server/prisma/migrations/`
4. Regenerate the Prisma client:
   ```bash
   pnpm -F @automo/server prisma:generate
   ```

### Apply pending migrations
1. Make sure the database is running: `pnpm -F @automo/server start:database`
2. Run:
   ```bash
   pnpm -F @automo/server prisma:migrate
   ```

### Check status
1. Run:
   ```bash
   pnpm -F @automo/server prisma:migrate:status
   ```

## Notes

- The database uses PostgreSQL with the CITEXT extension
- Schema file: `apps/server/prisma/schema.prisma`
- Seed file: `apps/server/prisma/seed.ts`
- After schema changes, always regenerate the client: `pnpm -F @automo/server prisma:generate`
