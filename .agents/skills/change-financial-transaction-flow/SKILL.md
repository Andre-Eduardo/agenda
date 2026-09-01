---
name: change-financial-transaction-flow
description: Use when changing billing, subscription, payment, appointment-payment, Asaas gateway, or financial-report behavior.
---

# Change Financial Transaction Flow

Financial behavior is cross-cutting. Start narrow, then map consumers.

## Required Context

Read:

- `apps/server/CLAUDE.md`
- relevant billing/subscription/payment services and tests (`apps/server/src/application/{billing,subscription,payment,appointment-payment,financial-report}`)
- relevant Cucumber step definitions before changing feature expectations

## Workflow

1. Identify whether the change affects a subscription plan, a payment intent, an Asaas webhook event, a recorded appointment payment, or a financial report projection.
2. Inspect the current persisted shape through repositories/mappers.
3. Inspect similar payment/billing tests and use cases before changing patterns.
4. Update domain/application behavior at the owner boundary.
5. Keep corrections append-only when a financial fact (a payment, an invoice line) already exists — never silently mutate a recorded transaction.
6. Update DTOs and the generated client if wire contracts change.
7. Update web/e2e factories that create payments/subscriptions.
8. Keep unit tests on public behavior. Do not use `Reflect` to force private method coverage; extract a collaborator or test the domain service through its public entrypoint.
9. Verify with focused Jest and focused Cucumber or Playwright.
10. For payment/billing changes, explicitly search for affected Cucumber scenarios and run them before considering the work complete.

## Rules

- Store and compare monetary amounts with `bignumber.js`, never raw floating point.
- Asaas webhook handlers must be idempotent — the same event can arrive more than once.
- Do not rely on stale flattened transaction fields in web or tests after a billing model change.
- Feature tables should match the real persisted transaction shape.
- Financial tests follow `docs/testing-patterns.md`/`docs/integration-test-patterns.md`.
