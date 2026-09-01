---
name: review-domain-model
description: Use when reviewing backend domain changes for DDD boundaries, aggregate consistency, invariants, domain naming, events, or misplaced business rules.
---

# Review Domain Model

Review the code as a DDD reviewer for the Agenda healthcare-scheduling domain.

Read `apps/server/CLAUDE.md` and `docs/architecture-overview.md` before judging server structure or test placement.

## Review Checklist

- Names match domain language (`Clinic`, `ClinicMember`, `Patient`, `Professional`, `Appointment`, `Record`, `ClinicalDocument`, `Billing`, `Subscription`, `Payment`, …).
- Invariants live in entities, value objects, aggregate roots, or domain services — entities extend `AggregateRoot` and emit domain events on meaningful state changes.
- Application services orchestrate without owning business rules.
- Controllers, DTOs, repositories, mappers, and React components do not decide business behavior.
- Repository interfaces are domain-facing and Prisma stays in infrastructure.
- Every tenant-scoped operation is properly isolated by `clinicId` (`docs/multi-tenant-isolation.md`).
- Domain exceptions extend `ExceptionBase`; never a bare `Error`/`HttpException` from domain or application code.
- Tests follow `docs/testing-patterns.md`/`docs/integration-test-patterns.md`.
- Deviations from project standards either have user approval as a new pattern or should trigger a CLAUDE.md/docs update suggestion.

## Output

Return findings first, ordered by severity:

- Critical issues
- Important improvements
- Nice-to-have improvements
- Missing tests
- Files to inspect next
