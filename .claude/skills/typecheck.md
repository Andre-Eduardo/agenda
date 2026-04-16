---
name: typecheck
description: Run TypeScript type checking across the monorepo or a specific app
user_invocable: true
---

# TypeScript Type Check

Run TypeScript compiler in type-check mode (no emit) to find type errors.

## Arguments

- `web` — typecheck only the web app
- `server` — typecheck only the server
- No argument — typecheck the entire monorepo

## Steps

1. Run the typecheck based on scope:
   - All: `pnpm typecheck`
   - Web only: `pnpm -F @automo/web typecheck`
   - Server only: `pnpm -F @automo/server typecheck`

2. If there are errors:
   - Parse the error output to identify affected files and line numbers
   - Read the relevant code sections
   - Suggest specific fixes for each error
   - If there are many errors, group them by category (missing imports, type mismatches, etc.)

3. If no errors, confirm the typecheck passed.
