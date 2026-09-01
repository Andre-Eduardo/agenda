---
name: write-cucumber-contract
description: Use when adding, changing, or debugging Cucumber feature files, step definitions, data tables, parser behavior, or business-contract tests in apps/server.
---

# Write Cucumber Contract

Cucumber features are business contracts, not implementation scripts.

## Workflow

1. Read the related feature file and step definitions.
2. Read `docs/integration-test-patterns.md` and inspect the existing table/parser helpers in `apps/server/test/support` when values or arrays are involved.
3. Reuse existing steps and table headers before adding new ones.
4. Use domain language in scenarios (`Clinic`, `Patient`, `Appointment`, `Record`, `ClinicalDocument`, etc.).
5. Keep one scenario per behavior.
6. Assert persisted shape when persistence is the contract.
7. Use `${ref:var:contextId}` for unique usernames/emails and `${ref:id:<entity>:<name>}` for dynamic IDs, so scenarios stay safe under parallel runs (the test DB is `test_integration_agenda`).
8. Run the smallest feature or scenario with `--retry 0`.
9. When a domain/unit change breaks a feature because the contract evolved, align the feature only after confirming the producing service and step-definition matcher reflect the intended behavior.

## Common Traps

- Updating expected tables without checking the step-definition query.
- Assuming table syntax is the problem when the persisted shape actually changed.
- Treating response assertions as more authoritative than later persisted-data assertions.
- Recreating old fields after a generated-contract change.
- Forgetting to `clearAgent()` before a new sign-in in the same scenario (the supertest agent persists cookies).

## Validation

```bash
pnpm -F @agenda-app/server exec cucumber-js test/features/path/file.feature --retry 0
```
