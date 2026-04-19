---
name: code-check
description: Run full code quality pipeline (lint + typecheck + tests + cast audit) before committing
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
   **Nunca "conserte" type errors adicionando `as any` ou `!`** — isso viola `docs/type-safety-patterns.md`. Use `toEnum`/`toEnumOrNull`, estreite tipos, ou conserte a raiz.

4. Audit de casts no código de produção (somente arquivos alterados):
   ```bash
   git diff --name-only --diff-filter=AM -- 'apps/server/src/**/*.ts' ':!apps/server/src/**/__tests__/**' \
     | xargs grep -nE "\bas any\b|as unknown as|![ \t]*\." 2>/dev/null
   ```
   - Qualquer match precisa de justificativa (ver lista de exceções no §10 de `docs/type-safety-patterns.md`).
   - Se o cast é novo e não justificado, refatore antes de commitar.

5. Run tests for changed files:
   - Detect changed files: `git diff --name-only`
   - Run relevant tests based on which app was changed

6. Report a summary:
   - Lint: pass/fail (N issues)
   - Typecheck: pass/fail (N errors)
   - Casts não-justificados: N (alvo: 0)
   - Tests: pass/fail (N tests)
