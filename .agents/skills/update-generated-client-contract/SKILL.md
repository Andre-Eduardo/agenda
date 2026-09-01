---
name: update-generated-client-contract
description: Use when server DTOs, OpenAPI schemas, generated client models, web consumers, fixtures, or e2e factories drift from each other.
---

# Update Generated Client Contract

The generated client is the contract bridge between server and web.

## Workflow

1. Inspect the server DTO/Zod schema and OpenAPI metadata (`@ApiSchema`, `@ApiOkResponse`, etc.).
2. Run `pnpm generate:client` when server contracts changed (this runs `pnpm -F @agenda-app/server openapi:generate` then `pnpm -F @agenda-app/client codegen`).
3. Inspect generated models under `packages/client/src/models`.
4. Update web consumers to the generated shape.
5. Update fixtures, translations, and e2e factories that build request/response payloads by hand.
6. Run package checks for the client and affected app.

## Rules

- Do not hand-edit generated client files as a lasting fix.
- Do not reintroduce removed flattened fields in web code.
- Keep request filters aligned with generated request params.
- The only file allowed to call Axios directly instead of a generated hook is `packages/client/src/api-client.ts` (the Orval mutator) — e.g. `downloadFile` for binary/report-export endpoints.
- Avoid `as any`/`as unknown as`; let generated types expose contract drift instead of silencing it.

## Validation

```bash
pnpm generate:client
pnpm -F @agenda-app/client code-check
pnpm -F @agenda-app/app code-check
```
