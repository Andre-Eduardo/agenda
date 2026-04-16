---
name: debug
description: Guided workflow to investigate and fix bugs — collects context, reproduces, traces root cause, and suggests fixes
user_invocable: true
---

# Debug Workflow

Guided investigation to find and fix bugs in the Automo application.

## Arguments

The user should describe:
- What is happening (the bug)
- What was expected
- Where it occurs (frontend, backend, or both)
- Any error messages or screenshots

## Steps

### Phase 1 — Collect Context

1. **Understand the bug:** Ask clarifying questions if the description is vague.
2. **Identify the domain area:** Which module is affected? (room, rental, person, cashier, etc.)
3. **Check recent changes:** Look at the git log for recent changes in the affected area:
   ```bash
   git log --oneline -20 -- <affected-path>
   ```

### Phase 2 — Locate the Code

4. **Trace the flow:**
   - **Frontend bug:** Start from the route → page component → child components → API calls → hooks
   - **Backend bug:** Start from the controller → service → domain entity → repository → database
   - **Full-stack bug:** Trace from the UI action → API call → server handler → response → UI rendering

5. **Read the relevant source files** to understand the current behavior.

6. **Check for related tests:** Find existing tests that cover (or should cover) this behavior:
   ```bash
   # For web
   find apps/web/src -name "*.test.tsx" -path "*<module>*"
   # For server
   find apps/server/src -name "*.test.ts" -path "*<module>*"
   ```

### Phase 3 — Identify Root Cause

7. **Form a hypothesis** about what's causing the bug.

8. **Verify the hypothesis:**
   - Read the specific code paths
   - Check types and interfaces for mismatches
   - Check API contracts (DTOs on server vs. generated client types)
   - Check translation keys if it's a UI text issue
   - Check Prisma schema if it's a data issue
   - Check the state machine if it's a room state issue (see `docs/room-state-flow.md`)

### Phase 4 — Fix

9. **Implement the fix:** Make the minimum necessary change to fix the root cause.

10. **Add or update tests:**
    - Write a test that would have caught this bug
    - Ensure existing tests still pass

11. **Verify the fix:**
    - Run affected tests: `pnpm -F <app> test -- --no-coverage <test-file>`
    - Run typecheck: `pnpm -F <app> typecheck`
    - Run lint: `pnpm -F <app> lint`

12. **Summarize:**
    - Root cause
    - What was changed and why
    - How to verify manually (if applicable)

## Common Bug Sources in This Project

- **Type mismatch between server and client:** Regenerate the client with `pnpm generate:client`
- **Missing translation keys:** Check all 3 language files
- **Stale React Query cache:** Check `queryKey` invalidation
- **Room state transitions:** Verify against the state machine in `docs/room-state-flow.md`
- **Prisma schema drift:** Run `pnpm -F @automo/server prisma:generate` after schema changes
- **Form validation:** Check Zod schemas and React Hook Form integration
