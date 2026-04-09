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

## UI Library Package (`@ui-lib`)

The UI library is an **external npm package** (not a workspace package) that provides the entire component and styling system. Key import paths:

```ts
// Layout and style system
import {Box} from '@ui-lib/components/Box';
import type {BoxStyle} from '@ui-lib/components/Box';

// Theme and providers
import {ThemeProvider} from '@ui-lib/ThemeProvider';
import {createThemeCache} from '@ui-lib/components/Theme';
import {useTheme} from '@ui-lib/components/Theme';
import type {ColorMode} from '@ui-lib/styles/theme/colors';
import type {SupportedColorMode} from '@ui-lib/styles/theme/colors';

// Sidebar system
import {SidebarProvider} from '@ui-lib/components/Sidebar/SidebarProvider';
import {Sidebar, SidebarItem, SidebarItemsGroup, SidebarSubItem, useSidebar} from '@ui-lib/components/Sidebar';

// Hooks
import {useValidatedForm} from '@ui-lib/hooks/useValidatedForm';
import {useTranslation} from '@ui-lib/hooks/useTranslation';
import {useMediaQuery} from '@ui-lib/hooks/useMediaQuery';
import {useNotification} from '@ui-lib/components/Notification';

// i18n resources (merged into app i18next instance)
import uiPtBr from '@ui-lib/translations/pt-BR';
import uiEnUs from '@ui-lib/translations/en-US';
import uiEsEs from '@ui-lib/translations/es-ES';
import type {SupportedLocales} from '@ui-lib/translations';
import type {Locale} from '@ui-lib/components/Locale';
```

All other UI components (Button, TextField, Table, etc.) follow the same import pattern: `@ui-lib/components/{ComponentName}`.
