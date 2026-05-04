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
   pnpm -F @agenda-app/server prisma:migrate
   ```
   (o Prisma solicitará o nome da migration interativamente — use `--name <migration_name>` se quiser passar direto)
3. Review the generated SQL in `apps/server/prisma/migrations/`
4. Regenerate the Prisma client:
   ```bash
   pnpm -F @agenda-app/server prisma:generate
   ```

### Apply pending migrations
1. Certifique-se que o banco está rodando (via Docker Compose ou serviço local)
2. Run:
   ```bash
   pnpm -F @agenda-app/server prisma:migrate
   ```

### Check status
1. Run:
   ```bash
   pnpm -F @agenda-app/server exec prisma migrate status
   ```

## Notes

- The database uses PostgreSQL with the CITEXT extension
- Schema file: `apps/server/prisma/schema.prisma`
- Seed file: `apps/server/prisma/seed.ts`
- After schema changes, always regenerate the client: `pnpm -F @agenda-app/server prisma:generate`
