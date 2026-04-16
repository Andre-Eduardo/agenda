---
name: test-web
description: Run frontend unit tests for changed or specified files
user_invocable: true
---

# Run Web Tests

Run Jest unit tests for the web application.

## Arguments

- If the user specifies a file or component, run tests for that specific file
- If no file is specified, detect changed test files via `git diff --name-only` and run those

## Steps

1. Determine which test files to run:
   - If a specific path was given, use it
   - Otherwise, find changed `.test.tsx` files: `git diff --name-only HEAD | grep '\.test\.tsx$'`

2. For each test file, run:
   ```bash
   pnpm -F @automo/web test -- --no-coverage <relative-path-from-apps/web>
   ```
   Note: The path must be relative to `apps/web/` (e.g., `src/views/modules/room/pages/RoomsPage/index.test.tsx`)

3. If tests fail, analyze the failure output and suggest fixes.

4. If all tests pass, report the results concisely.

## Tips

- Tests use `@testing-library/react` and `@testing-library/user-event`
- API mocks use MSW — check `src/utils/test/` for test utilities
- Translation mocks are in `src/utils/test/mockTranslation.ts`
