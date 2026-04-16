---
name: review
description: Review all pending changes before committing — runs diff analysis, lint, typecheck, and relevant tests
user_invocable: true
---

# Review Changes

Analyze all pending changes for quality, correctness, and completeness before committing.

## Steps

1. **Check what changed:**
   ```bash
   git status
   git diff --stat
   ```

2. **Analyze the diff in detail:**
   ```bash
   git diff
   git diff --cached
   ```
   Read the full diff. For each changed file, check:
   - Does the change make sense and follow project conventions?
   - Are there leftover debug logs, TODOs, or commented-out code?
   - Are imports clean (no unused imports)?
   - Are translations complete for all 3 languages (pt-BR, en-US, es-ES)?
   - Are there potential bugs, race conditions, or edge cases?

3. **Run lint:**
   ```bash
   pnpm lint
   ```
   If there are fixable issues, suggest running `pnpm lint:fix`.

4. **Run typecheck:**
   ```bash
   pnpm typecheck
   ```
   If there are errors, list them with file paths and suggest fixes.

5. **Run relevant tests:**
   - Detect which apps were changed from the diff
   - If `apps/web/` changed: `pnpm -F @automo/web test -- --no-coverage --changedSince=HEAD`
   - If `apps/server/` changed: `pnpm -F @automo/server test -- --no-coverage --changedSince=HEAD`
   - If `packages/value-objects/` changed: `pnpm -F @automo/value-objects test -- --no-coverage`

6. **Report a summary:**
   Present a clear checklist:
   - [ ] Diff reviewed — N files changed
   - [ ] Lint — pass/fail
   - [ ] Typecheck — pass/fail
   - [ ] Tests — pass/fail (N tests)
   - [ ] Issues found (list any problems)

   If everything passes, suggest the user can proceed with `/commit`.
