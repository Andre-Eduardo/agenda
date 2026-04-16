---
name: test-server
description: Run backend unit tests for changed or specified files
user_invocable: true
---

# Run Server Tests

Run Jest unit tests for the server application.

## Arguments

- If the user specifies a file or module, run tests for that specific target
- If no file is specified, detect changed test files via `git diff --name-only` and run those

## Steps

1. Determine which test files to run:
   - If a specific path was given, use it
   - Otherwise, find changed `.test.ts` files in `apps/server/`: `git diff --name-only HEAD | grep 'apps/server.*\.test\.ts$'`

2. For each test file, run:
   ```bash
   pnpm -F @automo/server test -- --no-coverage <relative-path-from-apps/server>
   ```
   Note: The path must be relative to `apps/server/` (e.g., `src/application/room/services/__tests__/GetRoomService.test.ts`)

3. If tests fail, analyze the failure output, check the test and the source code, then suggest fixes.

4. If all tests pass, report the results concisely.

## Tips

- Backend tests use `__tests__/` folders alongside the source files
- Use Fake builders for test data (check existing tests for patterns)
- Services extend `BaseApplicationService` — mock the repository dependencies
- Coverage requirements are strict: 100% for services and domain entities
