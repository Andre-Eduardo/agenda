---
name: generate-client
description: Regenerate the @agenda-app/client package from the server OpenAPI spec
user_invocable: true
source_tool: claude
source_path: .claude\skills\generate-client.md
imported_at: 2026-05-04T00:06:53.634Z
ai_context_version: 0.9.2
---

# Generate API Client

Regenerate the `@agenda-app/client` package after server API changes.

## Steps

1. Run the full client generation pipeline:
   ```bash
   pnpm -F @agenda-app/server openapi:generate && pnpm -F @agenda-app/client generate
   ```
   This runs two steps:
   - `pnpm -F @agenda-app/server openapi:generate` — generates `openapi.json` from NestJS decorators
   - `pnpm -F @agenda-app/client codegen` — runs Orval to generate TypeScript services, React Query hooks, and MSW mocks

2. If the generation succeeds, run typecheck to ensure no type errors were introduced:
   ```bash
   pnpm -F @agenda-app/app typecheck
   ```

3. Report which services/models were added or changed by checking the git diff on `packages/client/src/`.

## Important

- Never manually edit files in `packages/client/src/services/` or `packages/client/src/models/` — they are auto-generated.
- If the generation fails, check that the server compiles first: `pnpm -F @agenda-app/server build`
