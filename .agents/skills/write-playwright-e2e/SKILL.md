---
name: write-playwright-e2e
description: Use when adding or changing Playwright tests, page objects, factories, responsive checks, screenshots, or visual e2e coverage.
---

# Write Playwright E2E

Use the e2e page-object and factory patterns.

## Workflow

1. Read `e2e/README.md` and `docs/E2E_BLUEPRINT.md`.
2. Check `docs/mvp-features-pendentes.md` before assuming a route/page already exists — several sidebar entries point to screens the frontend hasn't implemented yet.
3. Add or update factories for setup data instead of driving the UI to create it.
4. Add page-object methods on top of/next to `e2e/pages/base-page.ts` for repeated UI interactions.
5. Use accessible locators and user-facing names.
6. Keep tests focused on user-critical behavior.
7. Use `desktop-chrome` for fast local validation; reserve `@visual` tags for the project's existing snapshot policy.

## Rules

- Do not depend on incidental DOM structure when a role/name locator is available.
- Do not use arbitrary waits for app state — use Playwright's web-first assertions.
- Keep visual snapshots intentional and reviewed; don't let an unrelated change silently update them.

## Validation

```bash
pnpm -F @agenda-app/e2e test:chrome path/to/test.ts
pnpm -F @agenda-app/e2e test path/to/test.ts --grep @visual
```
