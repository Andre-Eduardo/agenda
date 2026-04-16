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

3. After creation:
   - Register the service in the feature module
   - Run typecheck: `pnpm -F @automo/server typecheck`
   - Run tests: `pnpm -F @automo/server test -- --no-coverage <test-path>`
   - Remind user to regenerate client: `/generate-client`
