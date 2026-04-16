---
name: lint-fix
description: Run Oxlint to check and auto-fix linting issues
user_invocable: true
---

# Lint and Fix

Run Oxlint linter and auto-fix issues across the monorepo.

## Arguments

- `web` — lint only the web app
- `server` — lint only the server
- No argument — lint the entire monorepo

## Steps

1. Run lint with auto-fix:
   - All: `pnpm lint:fix`
   - Web only: `pnpm -F @automo/web lint:fix`
   - Server only: `pnpm -F @automo/server lint:fix`

2. If there are remaining issues that couldn't be auto-fixed:
   - Read the affected files
   - Apply manual fixes
   - Re-run lint to confirm all issues are resolved

3. Report what was fixed.

## Notes

- This project uses **Oxlint** (not ESLint) — the config is in `oxlint-base.json`
- Formatting is handled by **Oxfmt** — run `pnpm -F @automo/web format` or `pnpm -F @automo/server format`
