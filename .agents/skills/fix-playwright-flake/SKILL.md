---
name: fix-playwright-flake
description: Use when Playwright tests are flaky, timing-dependent, fail only in CI, fail only on one viewport, or produce unstable visual screenshots.
---

# Fix Playwright Flake

Treat flakes as synchronization or contract problems until proven otherwise.

## Workflow

1. Reproduce the smallest failing test and project.
2. Check whether the failure is viewport-specific, data-specific, or timing-specific.
3. Prefer web-first assertions over sleeps.
4. Replace fragile locators with role/name or other stable user-facing locators.
5. Move setup into factories when UI setup is not under test.
6. For visual tests, disable unstable animations or wait for stable UI state before the screenshot.
7. Re-run the same failing target before broadening the investigation.

## Validation

```bash
pnpm -F @agenda-app/e2e exec playwright test path/to/test.ts --project=desktop-chrome
pnpm -F @agenda-app/e2e test:failed
```
