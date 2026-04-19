# Backend Style Guide

Conventions and patterns used throughout the server codebase.

## Naming Conventions

### Files

| Type | Pattern | Example |
|------|---------|---------|
| Controller | `[entity].controller.ts` | `defect.controller.ts` |
| Service | `[action]-[entity].service.ts` | `create-defect.service.ts` |
| DTO | `[action]-[entity].dto.ts` | `create-defect.dto.ts` |
| Response DTO | `[entity].dto.ts` | `defect.dto.ts` |
| Entity | `[entity].ts` | `defect.ts` |
| Repository interface | `[entity].repository.ts` | `defect.repository.ts` |
| Prisma repository | `prisma-[entity].repository.ts` | `prisma-defect.repository.ts` |
| Mapper | `[entity].mapper.ts` | `defect.mapper.ts` |
| Module | `[domain].module.ts` | `defect.module.ts` |
| Test | `[entity].service.test.ts` | `create-defect.service.test.ts` |
| Test helper | `fake-[entity].ts` | `fake-defect.ts` |

### Classes

| Type | Convention | Example |
|------|-----------|---------|
| Service | `[Action][Entity]Service` | `CreateDefectService` |
| Controller | `[Entity]Controller` | `DefectController` |
| DTO | `[Action][Entity]Dto` | `CreateDefectDto` |
| Response DTO | `[Entity]Dto` | `DefectDto` |
| Entity | `[Entity]` | `Defect` |
| Entity ID | `[Entity]Id` | `DefectId` |
| Event | `[Entity][Action]Event` | `DefectCreatedEvent` |
| Exception key enum | `[Domain]Exceptions` | `DefectExceptions` |
| Permission enum | `[Domain]Permission` | `DefectPermission` |

### Methods in Services

| Action | Naming |
|--------|--------|
| Create | `CreateEntityService` |
| Read one | `GetEntityService` |
| Read many | `ListEntityService` / `SearchEntityService` |
| Update | `UpdateEntityService` |
| Delete | `DeleteEntityService` |
| Domain action | `[VerbAction]EntityService` (e.g., `FinishDefectService`, `PromoteFileService`) |

### Index Exports

Every `controllers/` and `services/` folder has an `index.ts` that re-exports all members. DTOs folder also has `index.ts`.

## DTOs

### Input DTOs (Zod-based)

Input DTOs are validated via Zod and use the `createZodDto` helper:

```typescript
import {z} from 'zod';
import {createZodDto} from '@/application/@shared/validation/zod-dto';
import {entityId} from '@/application/@shared/validation/validators';

export const createEntitySchema = z.object({
    companyId: entityId(CompanyId),           // Always include; injected automatically
    name: z.string().min(1).max(255),
    description: z.string().nullish(),        // Optional + nullable
    relatedId: entityId(RelatedId),
    amount: z.coerce.number().positive(),
});

export class CreateEntityDto extends createZodDto(createEntitySchema) {}
```

Key rules:
- `companyId` is always in the schema; the `CompanyInjectorPipe` fills it automatically
- Nullable optional fields use `.nullish()` (allows `null | undefined`)
- IDs are validated with the `entityId()` helper to ensure correct format
- Enums use `z.nativeEnum(MyEnum)`
- Numbers from HTTP use `z.coerce.number()` since HTTP params are strings

### Response DTOs (Class-based with decorators)

Response DTOs are plain classes with `@ApiProperty` decorators for OpenAPI generation:

```typescript
import {ApiProperty} from '@nestjs/swagger';
import {EntityDto, CompanyEntityDto} from '@/application/@shared/dto';

@ApiSchema({name: 'Entity'})
export class EntityDto extends CompanyEntityDto {
    @ApiProperty({description: 'The name', example: 'My Entity'})
    name!: string;

    @ApiProperty({description: 'The description', nullable: true})
    description!: string | null;

    @ApiProperty({description: 'Related entity', type: () => RelatedDto})
    related!: RelatedDto;
}
```

Base response DTOs:

```typescript
// EntityDto: id, createdAt, updatedAt (all are strings — ISO8601)
// CompanyEntityDto extends EntityDto: + companyId
```

### Paginated Responses

```typescript
export class PaginatedDto<T> {
    totalCount!: number;
    data!: T[];
}
```

## Controllers

Controllers are thin HTTP adapters. No business logic.

```typescript
@ApiTags('Entity')
@Controller('entities')
export class EntityController {
    constructor(
        private readonly createEntityService: CreateEntityService,
        private readonly listEntityService: ListEntityService,
        private readonly getEntityService: GetEntityService,
        private readonly updateEntityService: UpdateEntityService,
        private readonly deleteEntityService: DeleteEntityService,
    ) {}

    @Post()
    @Authorize(EntityPermission.CREATE)
    @ApiCreatedResponse({type: EntityDto})
    create(
        @RequestActor() actor: Actor,
        @Body() payload: CreateEntityDto,
    ): Promise<EntityDto> {
        return this.createEntityService.execute({actor, payload});
    }

    @Get()
    @Authorize(EntityPermission.VIEW)
    @ApiOkResponse({type: PaginatedEntityDto})
    list(
        @RequestActor() actor: Actor,
        @Query() payload: ListEntityDto,
    ): Promise<PaginatedDto<EntityDto>> {
        return this.listEntityService.execute({actor, payload});
    }

    @Get(':id')
    @Authorize(EntityPermission.VIEW)
    @ApiOkResponse({type: EntityDto})
    get(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', getEntitySchema.shape.id) id: EntityId,
    ): Promise<EntityDto> {
        return this.getEntityService.execute({actor, payload: {id}});
    }

    @Put(':id')
    @Authorize(EntityPermission.EDIT)
    @ApiOkResponse({type: EntityDto})
    update(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', updateEntitySchema.shape.id) id: EntityId,
        @Body() payload: UpdateEntityDto,
    ): Promise<EntityDto> {
        return this.updateEntityService.execute({actor, payload: {...payload, id}});
    }

    @Delete(':id')
    @Authorize(EntityPermission.DELETE)
    @HttpCode(HttpStatus.NO_CONTENT)
    delete(
        @RequestActor() actor: Actor,
        @ValidatedParam('id', deleteEntitySchema.shape.id) id: EntityId,
    ): Promise<void> {
        return this.deleteEntityService.execute({actor, payload: {id}});
    }
}
```

## Exception Handling

### Throwing Exceptions

Always throw domain exceptions from the `domain/@shared/exceptions` or the domain's own exception definitions. Never throw raw `Error` or NestJS `HttpException` from services.

```typescript
// Not found
throw new ResourceNotFoundException(EntityExceptions.not_found, entityId.toString());

// Invalid input
throw new InvalidInputException(EntityExceptions.already_exists);

// With field violations
throw new InvalidInputException(
    EntityExceptions.validation_failed,
    {},
    [{field: 'name', reason: 'Name is already taken'}]
);

// Precondition not met
throw new PreconditionException(EntityExceptions.cannot_delete_active);
```

### Exception Key Enums

Each domain defines its own exception keys:

```typescript
export const EntityExceptions = {
    not_found: 'exception.entity.not_found',
    already_exists: 'exception.entity.already_exists',
    cannot_delete_active: 'exception.entity.cannot_delete_active',
} as const;
```

Keys must exist in the translation files (`en-US.json`, `pt-BR.json`, `es-ES.json`).

### Error Response Format (RFC 9457)

All errors are returned as Problem Details:

```json
{
    "title": "Resource not found",
    "type": "https://developer.mozilla.org/docs/Web/HTTP/Status/404",
    "detail": "Entity with ID abc-123 was not found",
    "status": 404,
    "instance": "/api/entities/abc-123"
}
```

Validation errors include field violations:

```json
{
    "status": 400,
    "violations": [
        {"field": "name", "reason": "String must contain at least 1 character"}
    ]
}
```

## Authorization & Authentication

### Decorators

```typescript
// Require authentication + specific permission
@Authorize(EntityPermission.CREATE)

// Mark endpoint as public (no auth)
@Public()

// Validate company access via URL param (default: 'id')
@AuthorizeCompany('companyId')

// Disable company validation (admin endpoints)
@BypassCompany()

// Inject current authenticated user
@RequestActor() actor: Actor
```

### Permissions

Each domain defines a permission enum:

```typescript
export enum EntityPermission {
    CREATE = 'entity:create',
    VIEW = 'entity:view',
    EDIT = 'entity:edit',
    DELETE = 'entity:delete',
}
```

`@Authorize` accepts multiple permissions; if the user has **any one** of them, access is granted.

## Validation

### Route Param Validation

Use `@ValidatedParam` instead of plain `@Param` to run Zod validation on params:

```typescript
@ValidatedParam('id', schema.shape.id) id: EntityId
```

### Body / Query Validation

`ZodValidationPipe` runs globally. The DTO class must extend `createZodDto(schema)`:

```typescript
@Body() payload: CreateEntityDto     // Validated + transformed via Zod schema
@Query() filter: ListEntityDto       // Same
```

### Custom Validators

```typescript
// Validates that a string is a valid EntityId
export const entityId = (IdClass: typeof EntityId) =>
    z.string().refine((val) => {
        try { IdClass.from(val); return true; }
        catch { return false; }
    }, {message: `Invalid ${IdClass.name}`});
```

## Dependency Injection

- Always inject via constructor (no property injection)
- Repository interfaces (not implementations) are injected in application services
- `EventDispatcher` is always the last parameter and passed to `super(eventDispatcher)`
- Mappers are `@Injectable()` and injected where needed

## Logging

```typescript
constructor(private readonly logger: Logger) {}

this.logger.info('Operation completed', {entityId: entity.id.toString()});
this.logger.warn('Retry attempt', {attempt: n, reason: err.message});
this.logger.error('Unexpected failure', error);
```

Use structured logging — never use `console.log`.

## IDs

- All entity IDs are UUIDv7 (time-sortable)
- Each entity has a typed ID class (e.g., `DefectId extends EntityId`)
- IDs are value objects: use `.equals()` for comparison, `.toString()` for serialization
- Generate new IDs: `EntityId.generate()`
- Parse from string: `EntityId.from(rawString)` — throws if invalid

## Transactions

Use the `@Transactional()` decorator on service `handle()` methods when an operation must be atomic:

```typescript
@Transactional()
async handle({actor, payload}: Command<CreateEntityDto>): Promise<EntityDto> {
    // All repository operations here run in the same DB transaction
}
```

## OpenAPI Documentation

- Every controller method needs `@ApiOkResponse`, `@ApiCreatedResponse`, or `@ApiNoContentResponse`
- Response types should reference the DTO class: `{type: EntityDto}`
- For paginated responses, create a concrete class: `class PaginatedEntityDto extends PaginatedDto<EntityDto> {}`
- Use `@ApiSchema({name: 'EntityName'})` on response DTOs to control the schema name in Swagger
- `companyId` is hidden from OpenAPI by default via `createZodDto(schema, true)`

## Type Safety

**Não use casts** (`as`, `as any`, `as unknown as`, `!`) para "consertar" erros do TypeScript. Casts mascaram dados inválidos e criam tipos falsos. Quando a conversão for realmente necessária (fronteira com Prisma, HTTP, JSON), use as funções de inferência de `@domain/@shared/utils`:

```typescript
import {toEnum, toEnumOrNull, toEnumArray} from '@domain/@shared/utils';

// Mapper Prisma → Domínio
gender: toEnumOrNull(Gender, model.gender),
status: toEnum(ChatSessionStatus, model.status),
```

**Regras obrigatórias antes de qualquer commit:**

- Zero `as any` em `src/` (fora de `__tests__/`)
- IDs/value objects vindos de schemas Zod (`entityId()`, `phone()`, `z.nativeEnum()`) **já estão tipados** — não caste novamente
- Enums Prisma ↔ domínio usam `toEnum*` — runtime valida + TypeScript infere
- JSON fields na escrita Prisma usam `satisfies Prisma.XxxUncheckedCreateInput` + `Prisma.JsonNull`
- Snapshot de entidade: `new Entity(this)` — nunca `this.toJSON() as any`
- Non-null assertions (`!`) são proibidas — estreite o tipo do parâmetro ou use type guard

Detalhes completos, exemplos e lista de casts aceitáveis: [`docs/type-safety-patterns.md`](./type-safety-patterns.md).
