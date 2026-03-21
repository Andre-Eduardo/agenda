# Packages: Client & Value Objects

How the shared packages work and how they relate to the server.

## Overview

```
packages/
├── client/         # Generated API client (TypeScript + React Query)
└── value-objects/  # Shared domain value objects (used by server + client)
```

Both packages are part of the monorepo and consumed by the apps.

## packages/value-objects

### Purpose

Immutable domain value objects that are shared between the server and the frontend client. They encode validation rules and type safety for primitive-ish domain concepts.

### Value Object Pattern

All value objects follow this contract:

```typescript
export class SomeValue {
    // Immutable
    private readonly value: string;  // (or number, object, etc.)

    constructor(value: string) {
        SomeValue.validate(value);   // Throws on invalid input
        this.value = value;
    }

    // Static factory (preferred over constructor)
    static create(value: string): SomeValue {
        return new SomeValue(value);
    }

    // Validation (static, usable without instantiation)
    static validate(value: string): void {
        if (!isValid(value)) throw new Error('Invalid SomeValue: ...');
    }

    // Structural equality (never reference equality)
    equals(other: unknown): other is this {
        return other instanceof SomeValue && this.value === other.value;
    }

    // For display
    toString(): string { return this.value; }

    // For JSON serialization — returns primitive, not object
    toJSON(): string { return this.value; }
}
```

Key rules:
- Fields are `readonly` — never mutate after construction
- Constructor validates; throws descriptive error if invalid
- `equals()` compares by value, never by reference
- `toJSON()` returns a primitive so `JSON.stringify()` works transparently

### Examples

**Email:**
```typescript
export class Email {
    constructor(value: string) {
        if (!validator.isEmail(value)) throw new Error('Invalid email format.');
        this.value = value;
    }
    equals(other: unknown): other is this {
        // Case-insensitive
        return other instanceof Email && this.value.toLowerCase() === other.value.toLowerCase();
    }
}
```

**Currency:**
```typescript
export class Currency {
    static validate(value: string): void {
        const supportedValues = Intl.supportedValuesOf('currency');
        if (!supportedValues.includes(value.toUpperCase())) throw new Error('Invalid currency code.');
    }
}
```

**BigDecimal (extended BigNumber.js):**
```typescript
export class BigDecimal extends ExtendedBigNumber {
    static readonly ZERO = new BigDecimal(0);
    static readonly ONE_HUNDRED = new BigDecimal(100);

    percent(): BigDecimal { return this.dividedBy(BigDecimal.ONE_HUNDRED); }
    applyPercentage(value: BigDecimal): BigDecimal { return this.times(value.percent()); }
    addPercentage(value: BigDecimal): BigDecimal { return this.plus(this.applyPercentage(value)); }

    // BigDecimal.extend() makes all inherited BigNumber methods return BigDecimal
}
```

**Address:**
```typescript
export class Address {
    readonly country: string | null;
    readonly postalCode: string | null;
    readonly city: string | null;
    readonly street: string | null;
    // ...

    static validate(props: AddressProps): void {
        if (props.postalCode && props.country) {
            // Validates postal code format per country using validator.js
        }
    }
}
```

### Usage on the Server

Value objects appear in DTOs/Zod schemas and domain entities:

```typescript
// In Zod validation schema
companyId: entityId(CompanyId),        // EntityId is a value object
email: z.string().refine(Email.isValid) // Inline validation

// In domain entities
this.email = new Email(props.email);    // Throws on invalid
```

### Usage on the Client

```typescript
import {Email, Currency, BigDecimal} from '@project/value-objects';

const email = new Email('user@example.com'); // Validates on construction
const price = new BigDecimal(100).addPercentage(new BigDecimal(10)); // 110
```

### Package Build

```json
// packages/value-objects/package.json
{
    "main": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "exports": {
        ".": {
            "import": "./dist/index.mjs",
            "require": "./dist/index.js",
            "types": "./dist/index.d.ts"
        }
    }
}
```

Built with Vite lib mode (ESM + CJS output). TypeScript declarations generated separately.

---

## packages/client

### Purpose

A fully generated, type-safe HTTP client for the server API, with React Query hooks. The client is **never written manually** — it is generated from the server's OpenAPI specification using [Orval](https://orval.dev/).

### Generation Flow

```
Server (NestJS + Swagger) ──→ OpenAPI JSON ──→ Orval ──→ packages/client/src/
                                                              ├── models/     (TS interfaces matching server DTOs)
                                                              └── services/   (API call functions + React Query hooks)
```

Generation command (runs before TypeScript compilation):
```bash
orval --config orval.config.ts
```

### Orval Configuration

```typescript
// orval.config.ts
export default defineConfig({
    project: {
        input: {
            target: 'http://localhost:3000/api-json',  // Server OpenAPI spec endpoint
        },
        output: {
            mode: 'tags-split',                        // One file per API tag
            target: './src/services',
            schemas: './src/models',
            client: 'react-query',                     // Generates useQuery / useMutation hooks
            baseUrl: false,
            override: {
                mutator: {
                    path: './src/api-client.ts',
                    name: 'apiClient',                 // Custom Axios wrapper
                },
            },
        },
    },
});
```

### API Client (Custom Axios Instance)

```typescript
// packages/client/src/api-client.ts
import Axios from 'axios';

export const AXIOS_INSTANCE = Axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
    withCredentials: true,  // Required for cookie-based auth
});

// This is the mutator that Orval wraps all generated calls with
export const apiClient = <T>(
    config: AxiosRequestConfig,
    options?: AxiosRequestConfig,
): Promise<T> => {
    return AXIOS_INSTANCE({...config, ...options}).then(({data}) => data);
};
```

### Generated Models

Generated from server DTOs. One `interface` per DTO:

```typescript
// src/models/defectDto.ts  (auto-generated)
export interface DefectDto {
    id: string;
    companyId: string;
    note: string | null;
    roomId: string;
    defectType: DefectTypeDto;
    status: DefectDtoStatus;      // Enum values extracted from schema
    createdAt: string;
    updatedAt: string;
}

export type DefectDtoStatus = typeof DefectDtoStatus[keyof typeof DefectDtoStatus];

export const DefectDtoStatus = {
    OPEN: 'OPEN',
    FINISHED: 'FINISHED',
    CANCELED: 'CANCELED',
} as const;
```

### Generated Service Functions

```typescript
// src/services/defect.ts  (auto-generated)

// Plain function
export const createDefect = (createDefectDto: CreateDefectDto): Promise<DefectDto> => {
    return apiClient({
        url: '/defects',
        method: 'POST',
        data: createDefectDto,
    });
};

// React Query hook
export const useCreateDefect = (options?: UseMutationOptions<DefectDto, unknown, CreateDefectDto>) => {
    return useMutation({
        mutationFn: createDefect,
        ...options,
    });
};

export const listDefects = (params: ListDefectDto): Promise<PaginatedDefectDto> => {
    return apiClient({url: '/defects', method: 'GET', params});
};

export const useListDefects = (params: ListDefectDto, options?: UseQueryOptions<PaginatedDefectDto>) => {
    return useQuery({
        queryKey: ['defects', params],
        queryFn: () => listDefects(params),
        ...options,
    });
};
```

### Dependencies

```json
{
    "dependencies": {
        "axios": "^1.x",
        "@tanstack/react-query": "^5.x",
        "socket.io-client": "^4.x"
    },
    "devDependencies": {
        "orval": "^7.x",
        "msw": "^2.x",           // Mock Service Worker for testing
        "@faker-js/faker": "^8.x" // Test data generation
    }
}
```

### Consuming in a React App

```typescript
// In the app root
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Router />
        </QueryClientProvider>
    );
}

// In a component
import {useListDefects, useCreateDefect} from '@project/client';

function DefectList() {
    const {data, isLoading} = useListDefects({companyId, limit: 20});
    const createMutation = useCreateDefect({
        onSuccess: () => queryClient.invalidateQueries({queryKey: ['defects']}),
    });

    // ...
}
```

### Package Build

The client is built with Vite and TypeScript, with generation as a pre-build step:

```json
// package.json scripts
{
    "scripts": {
        "generate": "orval",
        "build": "npm run generate && tsc && vite build",
        "typecheck": "tsc --noEmit"
    }
}
```

### Keeping Client in Sync with Server

Workflow:
1. Change a server DTO or add a new endpoint
2. Start the server (`npm run dev` in `apps/server`)
3. Run `npm run generate` in `packages/client`
4. The client now has updated types and new hooks
5. TypeScript will catch breaking changes in the frontend

The OpenAPI spec is served by the server at `/api-json` (JSON format) and `/api` (Swagger UI).

---

## Monorepo Integration

Both packages are referenced as workspace dependencies:

```json
// apps/web/package.json
{
    "dependencies": {
        "@project/client": "workspace:*",
        "@project/value-objects": "workspace:*"
    }
}

// apps/server/package.json
{
    "dependencies": {
        "@project/value-objects": "workspace:*"
    }
}
```

Package manager: `pnpm` with workspaces.

Build order (for CI):
1. `value-objects` (no dependencies on other packages)
2. `client` (depends only on `value-objects` for shared types, if any)
3. `server` and `web` apps (depend on both packages)
