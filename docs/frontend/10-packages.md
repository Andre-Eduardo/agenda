# Workspace Packages

The monorepo has two internal workspace packages consumed by `apps/web`:

```json
// apps/web/package.json
"dependencies": {
  "@app/client": "workspace:*",
  "@app/value-objects": "workspace:*"
}
```

---

## `@app/client` — API Client Package

**Location**: `packages/client/`

### Purpose

Provides all API communication for the frontend. **Entirely auto-generated** from the OpenAPI specification using [Orval](https://orval.dev/). No API code is written by hand.

### What it exports

#### TypeScript Types / Models
All request params, response bodies, and domain models for every API resource.

#### React Query Hooks (per resource)
```ts
// Queries
useListItems(params)
useListItemsSuspense(params)
useGetItem(id)
useGetItemSuspense(id)

// Mutations
useCreateItem(options)
useUpdateItem(options)
useDeleteItem(options)

// Query key factories
getListItemsQueryKey(params?)
getGetItemQueryKey(id)

// Query options (for route loaders)
getListItemsSuspenseQueryOptions(params)
```

#### Auth Hooks
```ts
useSignIn(options)
useSignOut(options)
useGetUserPermissions(options)
getUserPermissionsQueryKey()
```

#### Company / Tenant Hooks
```ts
useGetCurrentCompany()
useGetCurrentCompanySuspense()
useListCompany(params)
useSwitchCompany(options)
getCurrentCompanyQueryKey()
```

#### User Hooks
```ts
useGetCurrentUser()
useGetCurrentUserSuspense()
```

#### WebSocket Service
```ts
import {webSocketService} from '@app/client/websocket';

webSocketService.connect(companyId);
webSocketService.disconnect();
```

#### MSW Handlers (for tests)
```ts
import {itemHandlers} from '@app/client/mocks';
```

### Generation Workflow

1. Update the OpenAPI spec in `packages/client/`
2. Run Orval codegen (`package.json` script inside the client package)
3. For each service, three files are regenerated:
   - `{service}.ts` — hooks + types + Axios functions
   - `{service}.msw.ts` — MSW request handlers
   - `{service}.mock.ts` — Faker-based data factories
4. **Never manually edit generated files**

### Critical configuration

The Axios instance inside `@app/client` uses `withCredentials: true`. This is required for the cookie-based authentication to work. Never remove this configuration.

---

## `@app/value-objects` — Shared Domain Models

**Location**: `packages/value-objects/`

### Purpose

Reusable domain value object classes with encapsulated validation and behavior. These are not API response models — they represent domain concepts that require logic beyond simple data transfer.

### Typical Value Object Categories

| Category | Examples |
|----------|---------|
| Numeric precision | Decimal / BigDecimal (prices, amounts) |
| Time | Duration, TimeZone |
| Identity | DocumentId (CPF/CNPJ), UUID wrappers |
| Contact | Phone, Address, Email |
| Visual | Color |
| Commerce | Discount, Price |

### Pattern

Each value object class encapsulates:
- Validation (`isValid()`)
- Formatting (`format()`, `toString()`)
- Comparison / equality
- Parsing from raw string/number

```ts
import {Phone} from '@app/value-objects';

const phone = new Phone('+55 11 99999-9999');
if (phone.isValid()) {
  phone.format();   // formatted string
}
```

### Note

Value objects are available as a dependency for shared domain logic. For form-level validation, Zod schemas in the component are used directly. Value objects become relevant when the same validation/format logic needs to be shared outside the web app.

---

## UI Components — shadcn/ui

UI components are **not an external package**. shadcn/ui installs component source files directly into `src/components/ui/`. They are owned code.

```ts
// Primitive components
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {Card, CardHeader, CardContent, CardFooter} from '@/components/ui/card';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Select, SelectTrigger, SelectContent, SelectItem, SelectValue} from '@/components/ui/select';
import {Textarea} from '@/components/ui/textarea';
import {Label} from '@/components/ui/label';
import {Skeleton} from '@/components/ui/skeleton';
import {Separator} from '@/components/ui/separator';
import {Tabs, TabsList, TabsTrigger, TabsContent} from '@/components/ui/tabs';
import {Table, TableHeader, TableBody, TableRow, TableHead, TableCell} from '@/components/ui/table';
import {Tooltip, TooltipTrigger, TooltipContent} from '@/components/ui/tooltip';
import {DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem} from '@/components/ui/dropdown-menu';
import {Sheet, SheetContent, SheetHeader, SheetTitle} from '@/components/ui/sheet';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Avatar, AvatarImage, AvatarFallback} from '@/components/ui/avatar';

// cn utility (from shadcn/ui setup)
import {cn} from '@/lib/utils';
```

Clinical-domain components live in `src/components/clinical/` and are hand-built on top of shadcn/ui primitives. See [design-system.md § 13](./design-system.md#13-mapa-de-componentes-clínicos-customizados).

To add a new shadcn component: `npx shadcn@latest add <component-name>`.
