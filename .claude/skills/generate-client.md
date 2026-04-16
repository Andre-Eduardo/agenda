---
name: generate-client
description: Regenerate the @automo/client package from the server OpenAPI spec
user_invocable: true
---

# Generate API Client

Regenerate the `@automo/client` package after server API changes.

## Steps

1. Run the full client generation pipeline:
   ```bash
   pnpm generate:client
   ```
   This runs two steps:
   - `pnpm -F @automo/server openapi:generate` — generates `openapi.json` from NestJS decorators
   - `pnpm -F @automo/client codegen` — runs Orval to generate TypeScript services, React Query hooks, and MSW mocks

2. If the generation succeeds, run typecheck to ensure no type errors were introduced:
   ```bash
   pnpm -F @automo/web typecheck
   ```

3. Report which services/models were added or changed by checking the git diff on `packages/client/src/`.

## Important

- Never manually edit files in `packages/client/src/services/` or `packages/client/src/models/` — they are auto-generated.
- If the generation fails, check that the server compiles first: `pnpm -F @automo/server build`
