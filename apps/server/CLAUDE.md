# Server — @agenda-app/server

NestJS 11 + Prisma 6 + PostgreSQL. Clean Architecture com DDD.

## Estrutura de pastas

```
src/
  application/   — HTTP layer: controllers, DTOs, application services, módulos NestJS
  domain/        — Lógica de negócio pura: entidades, interfaces de repositório, value objects
  infrastructure/ — Implementações: Prisma, JWT, S3/local storage, event dispatcher, logger
```

## Convenções de nomenclatura

| Artefato                | Padrão de arquivo               | Classe                                  |
| ----------------------- | ------------------------------- | --------------------------------------- |
| Controller              | `entity.controller.ts`          | `EntityController`                      |
| Service                 | `create-entity.service.ts`      | `CreateEntityService`                   |
| Input DTO               | `create-entity.dto.ts`          | `CreateEntityDto`                       |
| Response DTO            | `entity.dto.ts`                 | `EntityDto`                             |
| Entidade de domínio     | `entity.ts`                     | `Entity`                                |
| Repositório (interface) | `entity.repository.ts`          | `EntityRepository` (symbol + interface) |
| Repositório (Prisma)    | `prisma-entity.repository.ts`   | `PrismaEntityRepository`                |
| Mapper                  | `entity.mapper.ts`              | `EntityMapper`                          |
| Módulo                  | `entity.module.ts`              | `EntityModule`                          |
| Teste unitário          | `create-entity.service.test.ts` | —                                       |
| Fake helper             | `fake-entity.ts`                | —                                       |

Cada pasta `controllers/`, `services/` e `dtos/` deve ter um `index.ts` re-exportando tudo.

## Input DTOs (Zod)

```typescript
export const createEntitySchema = z.object({
  companyId: entityId(CompanyId), // sempre presente; injetado por CompanyInjectorPipe
  name: z.string().min(1).max(255),
  description: z.string().nullish(), // opcional + nullable
  amount: z.coerce.number().positive(),
});
export class CreateEntityDto extends createZodDto(createEntitySchema) {}
```

## Response DTOs (classe + @ApiProperty)

```typescript
@ApiSchema({ name: "Entity" })
export class EntityDto extends CompanyEntityDto {
  @ApiProperty() name!: string;
  @ApiProperty({ nullable: true }) description!: string | null;
}
// EntityDto herda: id, createdAt, updatedAt (strings ISO8601)
// CompanyEntityDto herda EntityDto + companyId
```

## Controllers

Thin HTTP adapters — zero lógica de negócio.

```typescript
@Post()
@Authorize(EntityPermission.CREATE)
@ApiCreatedResponse({type: EntityDto})
create(@RequestActor() actor: Actor, @Body() payload: CreateEntityDto): Promise<EntityDto> {
    return this.createEntityService.execute({actor, payload});
}

// Param validado com Zod:
@Get(':id')
get(@RequestActor() actor: Actor, @ValidatedParam('id', schema.shape.id) id: EntityId) { ... }
```

## Services (Application Layer)

Todos estendem `BaseApplicationService`. Controller chama `execute()`, subclasse implementa `handle()`.

```typescript
@Injectable()
export class CreateEntityService extends BaseApplicationService<CreateEntityDto, EntityDto> {
  constructor(
    private readonly entityRepository: EntityRepository,
    private readonly mapper: EntityMapper,
    protected readonly eventDispatcher: EventDispatcher,
  ) {
    super(eventDispatcher);
  }

  async handle({ actor, payload }: Command<CreateEntityDto>): Promise<EntityDto> {
    const entity = Entity.create({ ...payload, createdById: actor.userId });
    await this.entityRepository.save(entity);
    return this.mapper.toDto(entity);
  }
}
```

- `EventDispatcher` é sempre o último parâmetro e vai para `super()`
- Serviços de leitura (Get/List) **não** recebem `EventDispatcher`: `super()` sem args
- Use `@Transactional()` no `handle()` quando precisar de atomicidade

## Exceções de domínio

```typescript
throw new ResourceNotFoundException(EntityExceptions.not_found, entityId.toString());
throw new InvalidInputException(EntityExceptions.already_exists);
throw new PreconditionException(EntityExceptions.cannot_delete_active);
```

Nunca lance `Error` puro ou `HttpException` de services. Chaves de exceção devem existir nos 3 arquivos de tradução (`pt-BR`, `en-US`, `es-ES`).

## Type safety — regras obrigatórias

**Zero casts em `src/` fora de `__tests__/`.** Antes de commitar, confirme:

```bash
grep -rE "\bas any\b|as unknown as" apps/server/src/ --include="*.ts" | grep -v __tests__
```

- Enums Prisma ↔ domínio: sempre use `toEnum` / `toEnumOrNull` / `toEnumArray` de `@domain/@shared/utils` — eles validam em runtime e retornam o tipo correto
- IDs/value objects de DTOs Zod (`entityId()`, `phone()`) **já estão tipados** — nunca caste de novo
- JSON fields na escrita Prisma: use `satisfies Prisma.XxxUncheckedCreateInput` + `Prisma.JsonNull` para campos nullable (detalhes em §5 do doc)
- Snapshot de entidade (`oldState`): `new Entity(this)`, nunca `this.toJSON() as any`
- Non-null assertions (`!`) proibidas — estreite o parâmetro ou use guard explícito

**Referência completa e exemplos**: [`docs/type-safety-patterns.md`](../../docs/type-safety-patterns.md).

## Entidade de domínio

```typescript
export class Entity extends AggregateRoot<EntityId> {
  static create(props): Entity {
    const entity = new Entity({ id: EntityId.generate(), createdAt: new Date(), ...props });
    entity.addEvent(new EntityCreatedEvent({ entityId: entity.id }));
    return entity;
  }
  updateName(name: string): void {
    this.name = name;
    this.update(); // atualiza updatedAt
    this.addEvent(new EntityUpdatedEvent({ entityId: this.id }));
  }
}
```

- IDs são UUIDv7 tipados (`EntityId.generate()` / `EntityId.from(str)`)
- Compare IDs com `.equals()`, serialize com `.toString()`

## Repository interface

```typescript
// domain/entity/entity.repository.ts
export interface EntityRepository {
  findById(id: EntityId): Promise<Entity | null>;
  save(entity): Promise<void>;
}
export const EntityRepository = Symbol("EntityRepository"); // token de injeção
```

## Testes unitários (Jest + jest-mock-extended)

```typescript
const repo = mock<EntityRepository>();
const service = new CreateEntityService(repo, mapper, mock<EventDispatcher>());

it("should create", async () => {
  repo.findById.mockResolvedValue(fakeEntity());
  await expect(service.execute({ actor, payload })).resolves.toMatchObject({ name: "Test" });
  expect(repo.save).toHaveBeenCalledWith(expect.any(Entity));
});
```

- Teste de serviço: lógica de negócio, caminhos de erro, emissão de eventos
- Teste de controller: só verificar delegação para o service correto
- Use `fakeEntity()` / `fakeActor()` de `__tests__/fake-entity.ts`
- Congele o tempo: `jest.useFakeTimers({now: new Date('2024-01-01')})`
- `expect(promise).rejects.toThrowWithMessage(ResourceNotFoundException, key)` via jest-extended

## Testes de integração (Cucumber.js BDD)

```bash
pnpm -F @agenda-app/server test:integration
# feature específica:
pnpm -F @agenda-app/server exec cucumber-js test/features/auth/sign-in.feature
```

- Features em `test/features/<domínio>/<nome>.feature`
- Steps em `test/step-definitions/<domínio>.ts`
- Banco isolado: `test_integration_agenda` (sobrescreve `DATABASE_URL` automaticamente)
- Dados únicos: use `${ref:var:contextId}` em usernames/emails para evitar colisões paralelas
- IDs dinâmicos: `${ref:id:user:john_doe}` resolve o UUID guardado por `setVariableId()`
- Cookies: agent supertest persistente — chame `clearAgent()` antes de novo sign-in

## Autorização

```typescript
@Authorize(EntityPermission.CREATE)  // requer auth + permissão
@Public()                            // endpoint público
@AuthorizeCompany('companyId')       // valida acesso à empresa via param
```

## OpenAPI

- Todo método de controller precisa de `@ApiOkResponse`, `@ApiCreatedResponse` ou `@ApiNoContentResponse`
- Paginated: crie uma classe concreta `class PaginatedEntityDto extends PaginatedDto<EntityDto> {}`
- `@ApiSchema({name: '...'})` controla o nome do schema no Swagger
