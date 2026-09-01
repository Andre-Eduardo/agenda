---
name: create-server-use-case
description: Use when implementing or changing a backend use case in apps/server for domain, application, DTO, repository, mapper, Prisma, or Cucumber behavior.
---

# Create Server Use Case

Use this workflow for NestJS backend changes.

## Workflow

1. Read `apps/server/CLAUDE.md`, `docs/backend-style-guide.md`, and the closest existing feature module.
2. Read `docs/service-patterns.md` for the `BaseApplicationService`/`Command`/mapper conventions.
3. Identify the business behavior and the domain language.
4. Inspect similar use cases before creating a new pattern.
5. Locate the aggregate/entity/domain service that owns the invariant (`apps/server/src/domain`).
6. Keep orchestration in an application service extending `BaseApplicationService`; controllers call `execute()`, the service implements `handle()`.
7. Keep DTOs as Zod/OpenAPI transport contracts (`createZodDto`, `@ApiSchema`).
8. Keep Prisma in infrastructure repositories and mappers; convert Prisma ↔ domain enums with `toEnum`/`toEnumOrNull`/`toEnumArray` from `@domain/@shared/utils` (never a bare cast — see `docs/type-safety-patterns.md`).
9. Add or update unit tests for domain/application behavior (Jest + `jest-mock-extended`, see `docs/testing-patterns.md`).
10. Add or update Cucumber when the behavior is business-visible (`docs/integration-test-patterns.md`).
11. Run the smallest relevant validation.

## Checks

- Controllers are thin — zero business logic.
- Domain code does not import Prisma.
- Configuration and secrets are read through the typed `ConfigService`, never `process.env` directly outside its provider.
- Business rules are not hidden in repositories, DTOs, or test helpers.
- Domain events are emitted from entity behavior when other parts of the system react.
- Every tenant-scoped read/write filters by `clinicId` (`docs/multi-tenant-isolation.md`).
- Domain exceptions extend `ExceptionBase` (`InvalidInputException`/`ResourceNotFoundException`/etc.) — never a bare `Error` or `HttpException` from a service.
- Generated client changes are handled if DTO contracts change (`pnpm generate:client`).
- If the implementation revealed missing guidance, propose a CLAUDE.md/docs update.

## Validation

```bash
pnpm -F @agenda-app/server test -- path/to/file.test.ts --runInBand
pnpm -F @agenda-app/server exec cucumber-js test/features/path/file.feature --retry 0
pnpm -F @agenda-app/server code-check
```
