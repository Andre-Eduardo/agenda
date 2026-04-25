# Architecture Overview

This document describes the high-level architecture of the server application, intended as a reference for replicating this structure in new projects.

## Layered Architecture

The server follows a **Clean Architecture** / **Domain-Driven Design** approach with three primary layers:

```
apps/server/src/
├── application/          # Presentation layer (HTTP)
│   ├── @shared/          # Cross-cutting concerns (auth, validation, exceptions, logging)
│   └── [domain]/         # One folder per bounded context
│       ├── controllers/
│       ├── dtos/
│       ├── services/
│       └── [domain].module.ts
├── domain/               # Business logic layer
│   ├── @shared/          # Base classes (Entity, AggregateRoot, Repository interface)
│   └── [domain]/
│       ├── entities/
│       ├── repositories/ # Interfaces only
│       ├── services/     # Domain services (optional)
│       └── [domain].module.ts
└── infrastructure/       # Data & external integrations
    ├── config/           # Env config (Zod-validated)
    ├── repository/       # Prisma implementations
    ├── mappers/          # Domain <-> Prisma model <-> DTO
    ├── storage/          # File storage (local / S3)
    ├── event/            # Event dispatcher
    ├── logger/           # Winston
    └── infrastructure.module.ts
```

### Layer Responsibilities

| Layer | Responsibility | Key Technologies |
|-------|---------------|-----------------|
| **Application** | HTTP routing, request/response, input validation | NestJS, Zod, Swagger/OpenAPI |
| **Domain** | Business rules, aggregates, domain events | Plain TypeScript, DDD patterns |
| **Infrastructure** | DB persistence, file storage, config, logging | Prisma, AWS S3, Winston, NestJS Config |

## Module Anatomy

Each domain is self-contained. A complete module looks like:

```
[domain]/
├── [domain].module.ts          # NestJS module declaration
├── controllers/
│   ├── index.ts
│   └── [domain].controller.ts
├── dtos/
│   ├── index.ts
│   ├── create-[domain].dto.ts
│   ├── update-[domain].dto.ts
│   ├── [domain].dto.ts         # Response DTO
│   ├── list-[domain].dto.ts
│   └── get-[domain].dto.ts
└── services/
    ├── index.ts
    ├── create-[domain].service.ts
    ├── list-[domain].service.ts
    ├── get-[domain].service.ts
    ├── update-[domain].service.ts
    └── delete-[domain].service.ts
```

One service file per action (CQRS-inspired). Controllers are thin delegators — all logic lives in services.

## Module Registration

```typescript
// [domain].module.ts
@Module({
    imports: [DomainModule],
    controllers: [EntityController],
    providers: [
        CreateEntityService,
        GetEntityService,
        ListEntityService,
        UpdateEntityService,
        DeleteEntityService,
        EntityMapper,
    ],
})
export class EntityApplicationModule {}
```

## Global Setup (application.module.ts)

The following are registered globally:

| Type | Name | Purpose |
|------|------|---------|
| Guard | `AuthGuard` | JWT validation + permission check |
| Pipe | `ZodValidationPipe` | Validates body/query/params via Zod schema |
| Pipe | `ClinicMemberInjectorPipe` | Auto-injects `clinicId` from signed cookie |
| Filter | `ApiExceptionFilter` | Handles domain exceptions → RFC 9457 response |
| Filter | `HttpExceptionFilter` | Handles NestJS `HttpException` |
| Filter | `ZodExceptionFilter` | Handles `ZodError` from validation |
| Interceptor | `ExceptionLoggerInterceptor` | Logs all exceptions with context |

## Request Context (CLS)

A per-request context is maintained via `nestjs-cls`. It stores:

```typescript
interface RequestContext extends ClsStore {
    clinicId: string | undefined;  // From signed cookie
    actor: MaybeAuthenticatedActor; // Populated by AuthGuard
}
```

Middleware initializes the context, then guards populate it. Services access the actor via `@RequestActor()` decorator.

## Event System

Domain events flow like this:

1. Entity/aggregate adds an event: `this.addEvent(new SomethingHappenedEvent(...))`
2. Service calls `execute()` on `BaseApplicationService`, which calls `eventDispatcher.dispatch(actor)` after `handle()` completes
3. `EventDispatcher` publishes events to registered listeners
4. Listeners are decorated with `@OnEvents(EventClass)`

Events are only dispatched **after** the main operation succeeds. If `handle()` throws, no events are dispatched.

## Multi-Tenancy

The system is multi-tenant via `clinicId`:

- A signed cookie carries `clinicId` per request
- `ClinicMemberInjectorPipe` automatically adds it to all DTOs
- `@AuthorizeClinic(paramKey)` enforces company access at the controller level
- All entities have `clinicId` as a required field
- Repository queries always scope by `clinicId`

## Technology Stack Summary

| Concern | Technology |
|---------|-----------|
| Framework | NestJS |
| Database | PostgreSQL via Prisma |
| Validation | Zod (schemas) + class-transformer (response) |
| Auth | Signed JWT cookies |
| File storage | Local filesystem or AWS S3 |
| Logging | Winston (JSON structured) |
| Testing | Jest + jest-mock-extended + jest-extended |
| API docs | Swagger/OpenAPI (auto-generated) |
| Events | Custom in-memory event dispatcher |
| ID generation | UUIDv7 (time-sortable) |
| i18n | Custom translation system (en-US, es-ES, pt-BR) |
