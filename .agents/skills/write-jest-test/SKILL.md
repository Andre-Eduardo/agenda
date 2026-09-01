---
name: write-jest-test
description: Use when adding or changing unit tests in apps/server or packages/value-objects.
---

# Write Unit Test

Use this workflow for focused Jest unit tests. `apps/server` and `packages/value-objects` run Jest.
`apps/web` has no unit-test runner configured — its Vitest setup only drives Storybook
interaction/visual tests, so this skill does not apply there; see `create-react-feature`.

## Workflow

1. Read `docs/testing-patterns.md` and nearby tests for the same responsibility.
2. Test public behavior/contracts, not private implementation details.
3. Prefer existing fakers/builders (`__tests__/fake-entity.ts`) over ad hoc fixtures.
4. Use `it.each` for the same behavior with different inputs.
5. Do not use `Reflect` to call private methods or bypass class boundaries. If a branch matters, cover it through the public method, entity behavior, or a small extracted collaborator that follows local patterns.
6. Avoid `as any`/`as unknown as`; use the right type, `unknown` narrowing, faker override, or a small typed helper — casts are only tolerated inside `__tests__/` and only when there is no cleaner option (`docs/type-safety-patterns.md`).
7. Run the smallest relevant test command.
8. `apps/server/jest.config.ts` enforces 100% coverage thresholds project-wide; when you touch a file under `collectCoverageFrom`, finish with a coverage-enabled run and check it doesn't regress the threshold for that file. For genuinely unreachable defensive code (a TypeScript exhaustiveness guard, a "vfs no longer ships this file" guard), use `/* istanbul ignore next -- <why> */` rather than writing a misleading test — see existing examples via `grep -rn "istanbul ignore" apps/server/src`.

## Quick Reminders

- Prefer factory functions with typed overrides over mutable `let` fixtures and broad `beforeEach` setup.
- Follow `docs/testing-patterns.md` and `apps/server/CLAUDE.md`.
- Avoid `@nestjs/testing` for unit tests — instantiate the service directly with `jest-mock-extended` mocks.
- Avoid coverage-only tests that depend on private method names. They make refactors brittle and hide missing public behavior.
- Freeze time with `jest.useFakeTimers({now: new Date('2024-01-01')})` when a test depends on `Date.now()`/`new Date()`.
- `jest-extended` matchers (`toThrowWithMessage`, etc.) are available via `setupFilesAfterEnv`.

## Validation

```bash
pnpm -F @agenda-app/server test -- path/to/file.test.ts --runInBand --coverage=false
pnpm -F @agenda-app/value-objects test -- path/to/file.test.ts --runInBand
```

When coverage is part of the task, rerun without `--coverage=false` and confirm the relevant thresholds pass.
