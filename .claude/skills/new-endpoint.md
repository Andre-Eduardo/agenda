---
name: new-endpoint
description: Scaffold a new NestJS endpoint with DDD layers (controller, service, DTO, tests)
user_invocable: true
---

# Create New Endpoint

Scaffold a new NestJS endpoint following DDD architecture conventions.

## Arguments

The user should provide:
- Feature/module name
- HTTP method and route
- Brief description of what it does

## Steps

1. Gather requirements (if not provided):
   - Feature module (e.g., `room`, `rental`, `person`)
   - HTTP method (GET, POST, PUT, PATCH, DELETE)
   - Route path
   - Request/response shape

2. Create or update the following files:

### DTO (`src/application/{feature}/dtos/`)
```typescript
import {ApiProperty} from '@nestjs/swagger'

export class CreateFeatureDto {
  @ApiProperty({description: '...'})
  field: string
}
```

### Service (`src/application/{feature}/services/`)
```typescript
@Injectable()
export class CreateFeatureService extends BaseApplicationService<CreateFeatureDto, OutputDto> {
  constructor(private readonly repository: FeatureRepository) {
    super()
  }

  async handle({payload}: Command<CreateFeatureDto>): Promise<OutputDto> {
    // Implementation
  }
}
```

### Controller method (`src/application/{feature}/controllers/`)
Add the endpoint method to the existing controller.

### Test (`src/application/{feature}/services/__tests__/`)
```typescript
describe('CreateFeatureService', () => {
  // Test with fakes/mocks
})
```

## Type safety — checklist obrigatório

Ao escrever o código, **nunca** use `as any`, `as unknown as`, ou `!`. Veja `docs/type-safety-patterns.md`.

Casos comuns ao criar endpoint novo:

- **Payload do controller**: os campos do DTO Zod já estão tipados (IDs, enums, value objects). Passe direto para o service — sem cast.
  ```typescript
  // ✅ payload.patientId já é PatientId
  await this.service.execute({actor, payload: {id: payload.patientId}});
  ```

- **Mapper novo**: para converter enums Prisma ↔ domínio, use os helpers:
  ```typescript
  import {toEnum, toEnumOrNull, toEnumArray} from '@domain/@shared/utils';
  status: toEnum(MyDomainEnum, model.status),
  severity: toEnumOrNull(AlertSeverity, model.severity),
  ```

- **Repository com `upsert` e campos JSON**: use `satisfies Prisma.XxxUncheckedCreateInput` + `Prisma.JsonNull` para nullable JSON. Nunca `data as any`.

- **Snapshot de entidade em eventos**: `new Entity(this)`, nunca `this.toJSON() as any`.

- **Entidade filha salva num repo da pai** (ex: `Patient` em `PersonRepository`): a herança já resolve — sem cast.

3. After creation:
   - Register the service in the feature module
   - Run typecheck: `pnpm -F @agenda-app/server typecheck`
   - Confirme zero casts novos: `grep -rE "\bas any\b|as unknown as" apps/server/src/ --include="*.ts" | grep -v __tests__`
   - Run tests: `pnpm -F @agenda-app/server test -- --no-coverage <test-path>`
   - Remind user to regenerate client: `/generate-client`
