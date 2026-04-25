# Testing Patterns

How unit tests and integration tests are structured across the server.

## Test File Locations

```
src/application/[domain]/
├── services/
│   ├── create-entity.service.ts
│   └── __tests__/
│       └── create-entity.service.test.ts
├── controllers/
│   ├── entity.controller.ts
│   └── __tests__/
│       └── entity.controller.test.ts
└── __tests__/
    └── fake-entity.ts       # Fake data helpers for this domain
```

Tests live in a `__tests__/` folder alongside the source file they test.

## Test Naming Convention

Files: `[action]-[entity].service.test.ts`, `[entity].controller.test.ts`

Describe blocks:
```typescript
describe('A create-entity service', () => { ... });
describe('An entity controller', () => { ... });
```

Test cases:
```typescript
it('should create an entity', ...);
it('should throw an error when related entity does not exist', ...);
it('should repass the responsibility to the create service', ...);
```

## Unit Test: Service

```typescript
import {mock} from 'jest-mock-extended';

describe('A create-entity service', () => {
    // Create mocks for all dependencies
    const entityRepository = mock<EntityRepository>();
    const relatedRepository = mock<RelatedRepository>();
    const mapper = new EntityMapper();           // Use real mapper
    const eventDispatcher = mock<EventDispatcher>();

    // Instantiate service directly (no DI container)
    const service = new CreateEntityService(
        entityRepository,
        relatedRepository,
        mapper,
        eventDispatcher,
    );

    const actor = fakeActor();
    const now = new Date('2024-01-01T00:00:00Z');

    beforeEach(() => {
        jest.useFakeTimers({now});  // Freeze time for predictable assertions
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    it('should create an entity', async () => {
        const payload: CreateEntityDto = {
            clinicId: ClinicId.generate(),
            name: 'Test Entity',
            relatedId: RelatedId.generate(),
        };

        const entity = Entity.create({...payload, createdById: actor.userId});
        const related = fakeRelated({id: payload.relatedId});

        // Setup mocks
        jest.spyOn(Entity, 'create').mockReturnValue(entity);
        relatedRepository.findById.mockResolvedValue(related);

        // Execute
        await expect(service.execute({actor, payload})).resolves.toEqual(
            mapper.toDto(entity, related)
        );

        // Verify interactions
        expect(Entity.create).toHaveBeenCalledWith({...payload, createdById: actor.userId});
        expect(entityRepository.save).toHaveBeenCalledWith(entity);
        expect(relatedRepository.findById).toHaveBeenCalledWith(payload.relatedId);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor);
    });

    it('should throw when related entity does not exist', async () => {
        const payload: CreateEntityDto = {
            clinicId: ClinicId.generate(),
            name: 'Test Entity',
            relatedId: RelatedId.generate(),
        };

        relatedRepository.findById.mockResolvedValue(null);

        await expect(service.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            RelatedExceptions.not_found,
        );

        // Events must NOT be dispatched on failure
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
```

## Unit Test: Controller

Controllers only delegate to services. Tests verify the delegation:

```typescript
describe('An entity controller', () => {
    const createServiceMock = mock<CreateEntityService>();
    const listServiceMock = mock<ListEntityService>();
    const getServiceMock = mock<GetEntityService>();

    const controller = new EntityController(
        createServiceMock,
        listServiceMock,
        getServiceMock,
    );

    const actor = fakeActor();
    const mapper = new EntityMapper();

    describe('when creating an entity', () => {
        it('should delegate to CreateEntityService', async () => {
            const payload: CreateEntityDto = {
                clinicId: ClinicId.generate(),
                name: 'Test',
                relatedId: RelatedId.generate(),
            };
            const expected: EntityDto = {/* ... */};

            createServiceMock.execute.mockResolvedValue(expected);

            await expect(controller.create(actor, payload)).resolves.toEqual(expected);

            expect(createServiceMock.execute).toHaveBeenCalledWith({actor, payload});
            expect(listServiceMock.execute).not.toHaveBeenCalled();
        });
    });
});
```

## Mocking Patterns

### jest-mock-extended

Used for mocking interfaces and classes:

```typescript
import {mock} from 'jest-mock-extended';

const repository = mock<EntityRepository>();
repository.findById.mockResolvedValue(entity);
repository.findById.mockResolvedValueOnce(null); // Only for next call
repository.save.mockRejectedValue(new Error('DB error'));
```

### Spying on Static Methods

```typescript
jest.spyOn(Entity, 'create').mockReturnValue(fakeEntity);
// After test:
jest.restoreAllMocks(); // or jest.clearAllMocks() in afterEach
```

### Freezing Time

```typescript
beforeEach(() => {
    jest.useFakeTimers({now: new Date('2024-01-01T00:00:00Z')});
});
afterEach(() => {
    jest.useRealTimers();
});
```

## Fake Data Helpers

Each domain has fake data factories for tests:

```typescript
// __tests__/fake-entity.ts
export const fakeEntity = (overrides: Partial<EntityProps> = {}): Entity => {
    return new Entity({
        id: EntityId.generate(),
        clinicId: ClinicId.generate(),
        name: 'Fake Entity',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        deletedBy: null,
        ...overrides,
    });
};

export const fakeActor = (overrides: Partial<Actor> = {}): Actor => ({
    userId: UserId.generate(),
    ip: '127.0.0.1',
    ...overrides,
});
```

Fakes use generated IDs so tests are isolated from each other.

## Custom Matchers (jest-extended)

```typescript
// Throw with specific exception class and message key
expect(promise).rejects.toThrowWithMessage(ResourceNotFoundException, 'exception.entity.not_found');

// Array matching
expect(result.data).toEqual(expect.arrayContaining([entity1, entity2]));

// Object subset matching
expect(result).toMatchObject({name: 'Test', status: 'ACTIVE'});
```

Install: `jest-extended` adds many additional matchers (see docs).

## Test Setup (jest.config.ts)

```typescript
export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFilesAfterFramework: ['jest-extended/all'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    testMatch: ['**/__tests__/**/*.test.ts'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/__tests__/**',
        '!src/**/*.module.ts',
        '!src/main.ts',
    ],
};
```

## What to Test

| Layer | Test Focus |
|-------|-----------|
| **Service** | Business logic, error paths, event emission, repository calls |
| **Controller** | Correct service delegation, correct parameters passed |
| **Mapper** | `toDomain`, `toPersistence`, `toDto` transformations |
| **Value objects** | Validation errors, equality, serialization |
| **Domain entity** | Static factory, domain mutations, event emission |

**Do not test:**
- Modules (just wiring)
- Prisma repositories in unit tests (use integration tests)
- NestJS guards/pipes in unit tests (test in e2e)

## Domain Entity Testing

```typescript
describe('Entity', () => {
    describe('create', () => {
        it('should create with correct properties', () => {
            const props = {clinicId: ClinicId.generate(), name: 'Test'};
            const entity = Entity.create(props);

            expect(entity.name).toBe('Test');
            expect(entity.id).toBeDefined();
            expect(entity.events).toHaveLength(1);
            expect(entity.events[0]).toBeInstanceOf(EntityCreatedEvent);
        });
    });

    describe('updateName', () => {
        it('should update name and add event', () => {
            const entity = fakeEntity({name: 'Old'});
            entity.updateName('New');

            expect(entity.name).toBe('New');
            expect(entity.events).toHaveLength(1);
            expect(entity.events[0]).toBeInstanceOf(EntityUpdatedEvent);
        });
    });
});
```
