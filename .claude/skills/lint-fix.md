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
   - All: `pnpm run lint`
   - Web only: `pnpm -F @agenda-app/app lint`
   - Server only: `pnpm -F @agenda-app/server lint`

2. If there are remaining issues that couldn't be auto-fixed:
   - Read the affected files
   - Apply manual fixes
   - Re-run lint to confirm all issues are resolved

3. Report what was fixed.

## Notes

- This project uses **Oxlint** (not ESLint) — the config is in `oxlint-base.json`
- Formatting is handled by **Oxfmt** — run `pnpm -F @agenda-app/app format` or `pnpm -F @agenda-app/server format`
