# Service Patterns

How application services are structured and used throughout the server.

## Base Service Class

All application services extend `BaseApplicationService`:

```typescript
export abstract class BaseApplicationService<
    I = undefined,
    O = void,
    A extends MaybeAuthenticatedActor = Actor,
> implements ApplicationService<I, O, A> {
    protected constructor(protected readonly eventDispatcher?: EventDispatcher) {}

    async execute(command: Command<I, A>): Promise<O> {
        const result = await this.handle(command);
        this.eventDispatcher?.dispatch(command.actor); // Dispatch domain events after success
        return result;
    }

    protected abstract handle(command: Command<I, A>): Promise<O>;
}
```

Key points:
- `execute()` is the public method called by controllers
- `handle()` is the protected method that subclasses implement
- Domain events are dispatched **after** `handle()` returns — never on failure
- `EventDispatcher` is optional; services that don't produce events may omit it

## Command Pattern

Services receive a single `Command<I, A>` argument containing:

```typescript
interface Command<I, A extends MaybeAuthenticatedActor = Actor> {
    actor: A;    // Who is performing the action
    payload: I;  // Input DTO
}
```

Always destructure in `handle()`:

```typescript
async handle({actor, payload}: Command<CreateEntityDto>): Promise<EntityDto> {
    // actor.userId — who is doing this
    // payload — validated input
}
```

## Anatomy of a Create Service

```typescript
@Injectable()
export class CreateEntityService extends BaseApplicationService<CreateEntityDto, EntityDto> {
    constructor(
        private readonly entityRepository: EntityRepository,
        private readonly relatedRepository: RelatedRepository,  // If needed for validation
        private readonly mapper: EntityMapper,
        protected readonly eventDispatcher: EventDispatcher,
    ) {
        super(eventDispatcher);
    }

    async handle({actor, payload}: Command<CreateEntityDto>): Promise<EntityDto> {
        // 1. Validate related resources (if needed)
        const related = await this.relatedRepository.findById(payload.relatedId);
        if (!related) throw new ResourceNotFoundException(RelatedExceptions.not_found, payload.relatedId.toString());

        // 2. Create domain entity (static factory method on entity)
        const entity = Entity.create({
            ...payload,
            createdById: actor.userId,
        });

        // 3. Persist
        await this.entityRepository.save(entity);

        // 4. Map to DTO and return
        return this.mapper.toDto(entity, related);
    }
}
```

## Anatomy of a List Service

```typescript
@Injectable()
export class ListEntityService extends BaseApplicationService<ListEntityDto, PaginatedDto<EntityDto>> {
    constructor(
        private readonly entityRepository: EntityRepository,
        private readonly mapper: EntityMapper,
    ) {
        super(); // No eventDispatcher needed for reads
    }

    async handle({payload}: Command<ListEntityDto>): Promise<PaginatedDto<EntityDto>> {
        const {data, totalCount} = await this.entityRepository.list(payload);
        return {
            totalCount,
            data: data.map((entity) => this.mapper.toDto(entity)),
        };
    }
}
```

## Anatomy of a Get Service

```typescript
@Injectable()
export class GetEntityService extends BaseApplicationService<GetEntityDto, EntityDto> {
    constructor(
        private readonly entityRepository: EntityRepository,
        private readonly mapper: EntityMapper,
    ) {
        super();
    }

    async handle({payload}: Command<GetEntityDto>): Promise<EntityDto> {
        const entity = await this.entityRepository.findById(payload.id);
        if (!entity) throw new ResourceNotFoundException(EntityExceptions.not_found, payload.id.toString());
        return this.mapper.toDto(entity);
    }
}
```

## Anatomy of a Delete Service

```typescript
@Injectable()
export class DeleteEntityService extends BaseApplicationService<DeleteEntityDto> {
    constructor(
        private readonly entityRepository: EntityRepository,
        protected readonly eventDispatcher: EventDispatcher,
    ) {
        super(eventDispatcher);
    }

    async handle({actor, payload}: Command<DeleteEntityDto>): Promise<void> {
        const entity = await this.entityRepository.findById(payload.id);
        if (!entity) throw new ResourceNotFoundException(EntityExceptions.not_found, payload.id.toString());

        entity.delete(actor.userId); // Soft delete: sets deletedAt + deletedBy
        await this.entityRepository.save(entity);
    }
}
```

## Domain Services

Domain services (under `domain/[domain]/services/`) handle pure business logic that spans multiple entities or requires domain rules that don't fit a single entity:

```typescript
// domain/[domain]/services/some-domain.service.ts
@Injectable()
export class SomeDomainService {
    constructor(
        private readonly entityARepository: EntityARepository,
        private readonly entityBRepository: EntityBRepository,
    ) {}

    async validateBusinessRule(entityId: EntityAId, companyId: CompanyId): Promise<void> {
        const entity = await this.entityARepository.findById(entityId);
        if (!entity || !entity.companyId.equals(companyId)) {
            throw new ResourceNotFoundException(EntityExceptions.not_found, entityId.toString());
        }
        // Further validation...
    }
}
```

Application services inject domain services when needed.

## Event Listeners

Event listeners are services that react to domain events:

```typescript
@Injectable()
export class SomeEventListener {
    constructor(private readonly someService: SomeService) {}

    @OnEvents(SomethingHappenedEvent)
    async handle(actor: Actor, event: SomethingHappenedEvent): Promise<void> {
        await this.someService.execute({
            actor,
            payload: {entityId: event.entityId},
        });
    }
}
```

Register listeners in the module's `providers` array.

## Scheduled Jobs

Background jobs use NestJS scheduling:

```typescript
@Injectable()
export class SomeCleanupJob {
    constructor(private readonly someService: SomeService) {}

    @Cron(CronExpression.EVERY_HOUR)
    async handle(): Promise<void> {
        // Background processing
        const systemActor = createSystemActor();
        await this.someService.execute({actor: systemActor, payload: {}});
    }
}
```

## Transactional Services

Wrap the entire `handle()` in a transaction when the service must be atomic:

```typescript
@Transactional()
async handle({actor, payload}: Command<CreateEntityDto>): Promise<EntityDto> {
    // All repository calls here run within the same Prisma transaction
    await this.repoA.save(entityA);
    await this.repoB.save(entityB);
    return this.mapper.toDto(entityA);
}
```

The `@Transactional()` decorator wraps the method in `prisma.$transaction()` automatically.

## Service Registration in Module

```typescript
@Module({
    imports: [DomainModule],           // Provides repositories and domain services
    controllers: [EntityController],
    providers: [
        CreateEntityService,
        GetEntityService,
        ListEntityService,
        UpdateEntityService,
        DeleteEntityService,
        EntityMapper,
        // If there are event listeners or jobs:
        SomeEventListener,
        SomeScheduledJob,
    ],
})
export class EntityApplicationModule {}
```

## Mappers

Mappers translate between layers (domain ↔ persistence ↔ DTO):

```typescript
@Injectable()
export class EntityMapper extends MapperWithDto<Entity, EntityModel, EntityDto> {
    toDomain(model: EntityModel): Entity {
        return new Entity({
            id: EntityId.from(model.id),
            companyId: CompanyId.from(model.companyId),
            name: model.name,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: model.deletedAt,
            deletedBy: model.deletedBy ? UserId.from(model.deletedBy) : null,
        });
    }

    toPersistence(entity: Entity): EntityModel {
        return {
            id: entity.id.toString(),
            companyId: entity.companyId.toString(),
            name: entity.name,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt,
            deletedBy: entity.deletedBy?.toString() ?? null,
        };
    }

    toDto(entity: Entity): EntityDto {
        return {
            id: entity.id.toString(),
            companyId: entity.companyId.toString(),
            name: entity.name,
            createdAt: entity.createdAt.toISOString(),
            updatedAt: entity.updatedAt.toISOString(),
        };
        // Note: deletedAt / deletedBy are NOT included in DTOs
    }
}
```

## Domain Entity Pattern

```typescript
export class Entity extends AggregateRoot<EntityId> {
    readonly companyId: CompanyId;
    name: string;

    constructor(props: EntityProps) {
        super(props);
        this.companyId = props.companyId;
        this.name = props.name;
    }

    // Static factory — the only way to create new instances
    static create(props: CreateEntityProps): Entity {
        const entity = new Entity({
            id: EntityId.generate(),
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            deletedBy: null,
            ...props,
        });
        entity.addEvent(new EntityCreatedEvent({entityId: entity.id}));
        return entity;
    }

    // Domain mutation methods
    updateName(name: string): void {
        this.name = name;
        this.update(); // Updates updatedAt
        this.addEvent(new EntityUpdatedEvent({entityId: this.id}));
    }

    toJSON(): EntityJson<Entity> {
        return {
            id: this.id.toString(),
            companyId: this.companyId.toString(),
            name: this.name,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
```

## Repository Interface Pattern

```typescript
// domain/[domain]/repositories/entity.repository.ts
export interface EntityRepository {
    findById(id: EntityId): Promise<Entity | null>;
    findByCompanyId(companyId: CompanyId): Promise<Entity[]>;
    list(filter: ListEntityDto): Promise<{data: Entity[]; totalCount: number}>;
    save(entity: Entity): Promise<void>;
    delete(entity: Entity): Promise<void>;
}

export const EntityRepository = Symbol('EntityRepository');
```

The repository symbol is used for injection token to allow the infrastructure module to provide the Prisma implementation without the domain layer depending on Prisma.

## Prisma Repository Pattern

```typescript
// infrastructure/repository/prisma/prisma-entity.repository.ts
@Injectable()
export class PrismaEntityRepository extends PrismaRepository implements EntityRepository {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly mapper: EntityMapper,
    ) {
        super(prismaService);
    }

    async findById(id: EntityId): Promise<Entity | null> {
        const model = await this.prisma.entity.findUnique({
            where: {id: id.toString(), deletedAt: null},
        });
        return model ? this.mapper.toDomain(model) : null;
    }

    async list({companyId, limit, page, sort}: ListEntityDto): Promise<{data: Entity[]; totalCount: number}> {
        const pagination = this.normalizePagination({limit, page, sort});
        const where = {companyId: companyId.toString(), deletedAt: null};

        const [data, totalCount] = await this.prisma.$transaction([
            this.prisma.entity.findMany({where, ...pagination}),
            this.prisma.entity.count({where}),
        ]);

        return {
            data: data.map((m) => this.mapper.toDomain(m)),
            totalCount,
        };
    }

    async save(entity: Entity): Promise<void> {
        const data = this.mapper.toPersistence(entity);
        await this.prisma.entity.upsert({
            where: {id: data.id},
            create: data,
            update: data,
        });
    }

    async delete(entity: Entity): Promise<void> {
        await this.safeDelete(entity, 'entity', {id: entity.id.toString()});
    }
}
```
