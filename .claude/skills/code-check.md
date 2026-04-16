---
name: code-check
description: Run full code quality pipeline (lint + typecheck + tests) before committing
user_invocable: true
---

# Full Code Check

Run the complete code quality pipeline to ensure everything is ready for commit.

## Steps

1. Run the full code-check command:
   ```bash
   pnpm code-check
   ```
   This runs lint + typecheck across the entire monorepo.

2. If there are lint errors, attempt auto-fix:
   ```bash
   pnpm lint:fix
   ```

3. If there are type errors, read the affected files and suggest fixes.

4. Run tests for changed files:
   - Detect changed files: `git diff --name-only`
   - Run relevant tests based on which app was changed

5. Report a summary:
   - Lint: pass/fail (N issues)
   - Typecheck: pass/fail (N errors)
   - Tests: pass/fail (N tests)
