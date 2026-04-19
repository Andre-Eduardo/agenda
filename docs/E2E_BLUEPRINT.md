# Blueprint de Testes E2E — Guia Auto-Contido para Implementação

Documento de referência para um agente de código implementar uma suite de testes E2E em uma aplicação full-stack (backend + frontend web + banco relacional). O guia é **independente de domínio**: descreve padrões, estrutura, helpers e código pronto para copiar. Substitua os exemplos genéricos (`User`, `Organization`, `Item`) pelas entidades reais do seu domínio.

---

## 1. Visão Geral da Arquitetura

Suite baseada em **Playwright + TypeScript** com:

- **Page Object Model (POM)** com classe abstrata base (`BasePage`).
- **Fixtures customizadas** que pré-instanciam page objects e factories.
- **Factories via ORM** que escrevem direto no banco (sem passar pela UI) para preparar estado.
- **Login via chamada HTTP direta** à API (não pela UI), exceto nos testes de sign-in.
- **Projetos múltiplos** para viewports (desktop, tablet, mobile).
- **Testes visuais** com tag `@visual`, rodando em Docker para consistência de rendering.
- **Permissões declarativas** — cada `describe` lista os `resource:action` que o usuário fake recebe.
- **Isolamento total** entre testes: cada teste cria sua própria organização/tenant.

### Por que cada decisão

| Decisão | Motivo |
|---|---|
| Login por API | ~10x mais rápido e não é o que o teste quer exercitar |
| Factories direto no ORM | Evita dependência da UI para criar pré-condições |
| POM + BasePage | Reuso, manutenção centralizada, testes legíveis |
| Fixtures do Playwright | DI automática, page objects sempre prontos |
| Visual em Docker | Rendering varia entre hosts — baselines instáveis fora disso |
| Tenant por teste | Paralelismo real, zero cross-contamination |
| UUIDv7 | Ordenação temporal natural em inserts |

---

## 2. Stack e Dependências

```json
{
  "dependencies": {
    "@playwright/test": "^1.58.0",
    "@prisma/client": "^6.0.0",
    "uuidv7": "^1.0.0"
  },
  "devDependencies": {
    "prisma": "^6.0.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0",
    "@types/node": "^22.0.0",
    "eslint": "^9.0.0",
    "eslint-plugin-playwright": "^2.0.0"
  }
}
```

A suite é um workspace separado (ex.: pasta `e2e/` do monorepo) que consome:
- O schema do ORM do backend (Prisma usado aqui, mas o padrão se aplica a qualquer ORM com cliente TS).
- A mesma função de hash de senha usada pelo backend (ou um endpoint público de registro).

---

## 3. Estrutura de Pastas

```
e2e/
├── tests/                   # Arquivos de teste por feature
│   ├── auth/
│   │   └── sign-in.test.ts
│   └── <feature>/
│       └── <acao>.test.ts
├── pages/                   # Page Object Model
│   ├── base-page.ts         # Classe abstrata com helpers compartilhados
│   ├── auth/
│   │   └── sign-in-page.ts
│   └── <feature>/
│       └── <pagina>-page.ts
├── components/              # Component objects compartilhados (sidebar, header, modal)
│   └── <nome>/<nome>-component.ts
├── fixtures/
│   └── test.ts              # Fixtures customizadas (DB, factories, page objects)
├── lib/
│   ├── auth.ts              # Helper de login via API + hash de senha
│   └── factories/           # Factories de dados (ORM direto)
│       ├── prisma.ts        # Instância única do cliente
│       ├── index.ts         # Re-export de todas factories
│       ├── organization.ts
│       ├── user.ts
│       └── organization-user.ts
├── assets/                  # Imagens/arquivos para upload em testes
├── screenshots/             # Baselines de testes visuais (COMMITAR no repo)
├── test-results/            # Artefatos (gitignored)
├── playwright-report/       # Relatórios HTML (gitignored)
├── playwright.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── docker-compose.yml
├── Dockerfile
├── package.json
└── README.md
```

---

## 4. `tsconfig.json`

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "types": ["node", "@playwright/test"],
    "paths": {
      "*": ["./*"],
      "@fixtures/*": ["./fixtures/*"],
      "@lib/*": ["./lib/*"],
      "@pages/*": ["./pages/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", "playwright-report", "test-results"]
}
```

Os três aliases (`@fixtures`, `@lib`, `@pages`) são essenciais — todo o código abaixo depende deles.

---

## 5. `playwright.config.ts`

```typescript
import path from 'node:path';
import * as process from 'node:process';
import {defineConfig, devices} from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';
const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export default defineConfig({
    testDir: './tests',
    timeout: 30 * 1000,
    testMatch: '**/*.test.ts',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: 1,
    maxFailures: process.env.CI ? 1 : undefined,
    reporter: [
        ['html', {outputFolder: 'playwright-report'}],
        ['json', {outputFile: 'test-results/results.json'}],
        ['junit', {outputFile: 'test-results/junit.xml'}],
        ['list'],
    ],
    snapshotPathTemplate: 'screenshots/{testFilePath}/{arg}_{projectName}{ext}',
    updateSnapshots: process.env.CI ? 'none' : 'missing',
    expect: {timeout: 10 * 1000},
    use: {
        baseURL: BASE_URL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'on-first-retry',
        viewport: {width: 1280, height: 720},
        locale: 'en-US',
        timezoneId: 'Pacific/Honolulu',
    },
    projects: [
        {name: 'desktop-chrome', use: {...devices['Desktop Chrome']}},
        {name: 'tablet-chrome', use: {...devices['Galaxy Tab S4']}},
        {name: 'mobile-chrome', use: {...devices['Galaxy S24']}},
    ],
    webServer: [
        {
            command: 'pnpm -F <pacote-do-server> start:prod',
            url: `${API_URL}/api/v1/health`,
            reuseExistingServer: true,
            timeout: 120 * 1000,
            cwd: path.join(__dirname, '..', 'apps', 'server'),
        },
        {
            command: 'pnpm -F <pacote-do-web> preview',
            url: BASE_URL,
            reuseExistingServer: true,
            timeout: 120 * 1000,
            cwd: path.join(__dirname, '..', 'apps', 'web'),
        },
    ],
});
```

**Pontos críticos**:
- `fullyParallel: true` **exige** que testes criem dados próprios.
- `timezoneId` e `locale` **fixos** evitam flakes em datas/moedas/formatação.
- `snapshotPathTemplate` inclui `{projectName}` — desktop/tablet/mobile têm baselines separados.
- `updateSnapshots: 'none'` em CI impede criação acidental de baselines.
- `retries: 1` — retries maiores mascaram flakiness real.

---

## 6. `BasePage` — Classe Abstrata Base (Código Completo)

```typescript
// pages/base-page.ts
import type {Locator, Page, PageAssertionsToHaveScreenshotOptions} from '@playwright/test';
import {expect} from '@fixtures/test';

export type DurationInput = {
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
};

export const CHECKBOX = '__CHECKBOX__';

export abstract class BasePage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async verifyRequiredErrorMessage(locator: Locator) {
        await this.verifyErrorMessage(locator, /required/i);
    }

    async verifyErrorMessage(locator: Locator, errorMessage: string | RegExp) {
        await expect(locator).toHaveAccessibleErrorMessage(errorMessage, {
            ignoreCase: true,
        });
    }

    async verifyNotification(message: string | RegExp) {
        await expect(
            this.page.getByRole('alert', {name: new RegExp(message, 'i')}).first()
        ).toBeVisible();
    }

    async verifyAccessDenied() {
        await expect(this.page.getByText(/permission required/i)).toBeVisible();
    }

    async closeNotification() {
        await this.page.getByRole('alert').first().getByRole('button', {name: /close/i}).click();
    }

    async compareScreenshot(name: string, options?: PageAssertionsToHaveScreenshotOptions) {
        await this.page.mouse.wheel(0, -10000);
        await this.page.mouse.move(0, 0);
        await expect(this.page).toHaveScreenshot(`${name}.png`, {
            fullPage: true,
            maxDiffPixels: 100,
            threshold: 0.2,
            animations: 'disabled',
            ...options,
        });
    }

    async fillDurationInput(fieldLocator: Locator, duration: DurationInput) {
        await fieldLocator.click();

        const daysLocator = this.page.locator('input[name="d"]');
        const hoursLocator = this.page.locator('input[name="h"]');
        const minutesLocator = this.page.locator('input[name="m"]');
        const secondsLocator = this.page.locator('input[name="s"]');

        if ((await daysLocator.count()) > 0) {
            await daysLocator.fill(duration.days?.toString() ?? '0');
        }
        if ((await hoursLocator.count()) > 0) {
            await hoursLocator.fill(duration.hours?.toString() ?? '0');
        }
        if ((await minutesLocator.count()) > 0) {
            await minutesLocator.fill(duration.minutes?.toString() ?? '0');
        }
        if ((await secondsLocator.count()) > 0) {
            await secondsLocator.fill(duration.seconds?.toString() ?? '0');
        }

        await fieldLocator.click();
    }

    verifyUrlParams(params: Record<string, string | number | boolean | string[]>) {
        const url = new URL(this.page.url());

        for (const [key, value] of Object.entries(params)) {
            if (Array.isArray(value)) {
                const urlValues = url.searchParams.getAll(key);
                expect(urlValues.sort()).toEqual(value.sort());
            } else {
                expect(url.searchParams.get(key)).toBe(String(value));
            }
        }
    }

    async clickTableAction(row: Locator, name: string) {
        await this.expandTableRowIfNeeded(row);

        await row
            .getByRole('button', {name: new RegExp(name, 'i')})
            .or((await this.getTableSubRow(row)).getByRole('button', {name: new RegExp(name, 'i')}))
            .click();
    }

    protected async verifyTableRow(row: Locator, cells: Record<string, string>): Promise<void> {
        await expect(this.page.locator('.loading-spinner')).toBeHidden();

        const table = row.locator('xpath=ancestor::table');
        const headerCells = await table.locator('thead th').all();
        const subrow = await this.getTableSubRow(row);

        await this.expandTableRowIfNeeded(row);

        for (const [columnName, expectedValue] of Object.entries(cells)) {
            if (columnName === CHECKBOX) {
                await expect(row.getByRole('checkbox').first()).toBeChecked({
                    checked: expectedValue === 'true',
                });
                continue;
            }

            const escapedName = this.escapeRegExp(columnName);
            const subrowItem = subrow
                .locator('.responsive-sub-row-item')
                .filter({hasText: new RegExp(`^${escapedName}:\\s`, 'i')});

            if ((await subrowItem.count()) > 0) {
                await expect(subrowItem).toHaveText(
                    new RegExp(`${escapedName}:.*${this.escapeRegExp(expectedValue)}`, 'i')
                );
                continue;
            }

            let colIndex = -1;
            for (let i = 0; i < headerCells.length; i++) {
                const text = (await headerCells[i].textContent())?.trim().toLowerCase();
                if (text === columnName.toLowerCase()) {
                    colIndex = i;
                    break;
                }
            }

            if (colIndex < 0) {
                throw new Error(`Column "${columnName}" not found in table headers`);
            }

            await expect(row.locator('td').nth(colIndex)).toHaveText(
                new RegExp(this.escapeRegExp(expectedValue), 'i')
            );
        }
    }

    protected async expandTableRowIfNeeded(row: Locator): Promise<void> {
        await row.locator('td').first().waitFor({state: 'visible'});
        const expandButton = row.getByRole('button', {name: 'Expand row'});

        if (await expandButton.isVisible()) {
            await expandButton.click();
        }
    }

    protected async getTableSubRow(row: Locator): Promise<Locator> {
        const ariaControls = await row.getAttribute('aria-controls');
        return this.page.locator(`[id="${ariaControls}"]`);
    }

    protected escapeRegExp(value: string): string {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    abstract navigate(...args: unknown[]): Promise<void>;
    abstract verifyPageLoaded(...args: unknown[]): Promise<void>;
}
```

**Contrato**: toda page object deve implementar `navigate()` e `verifyPageLoaded()`.

**Adaptações que podem ser necessárias**:
- Se sua UI não usa `.loading-spinner`, ajuste em `verifyTableRow`.
- Se não usa sub-rows responsivas, remova `expandTableRowIfNeeded`/`getTableSubRow`.
- Se mensagem de "acesso negado" for diferente, ajuste em `verifyAccessDenied`.

---

## 7. Login via API — `lib/auth.ts`

```typescript
import crypto from 'crypto';
import type {Page} from '@playwright/test';

export async function login(
    page: Page,
    options: {
        username: string;
        password: string;
        tenantId?: string; // companyId, organizationId, etc.
    }
) {
    const baseUrl = process.env.API_URL ?? 'http://localhost:3000';
    const url = `${baseUrl.replace(/\/$/, '')}/api/v1/auth/sign-in`;

    const response = await page.request.post(url, {
        data: {
            username: options.username,
            password: options.password,
            tenantId: options.tenantId,
        },
    });

    if (!response.ok()) {
        throw new Error(`API login failed: ${response.status()} ${await response.text()}`);
    }

    // Opcional: injetar estado inicial no localStorage (tema, sidebar, flags de auth)
    await page.addInitScript(() => {
        window.localStorage.setItem(
            'app-storage',
            JSON.stringify({
                state: {colorMode: 'light', auth: true, sidebarCollapsed: true},
                version: 0,
            })
        );
    });
    // Cookies setados pela resposta ficam no contexto do browser automaticamente.
}

// Mesmo algoritmo do backend. Se o backend usa bcrypt/argon, replique aqui.
// Formato deste exemplo: `64:<salt-base64>:<derived-key-base64>` com scrypt.
export function hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16);
        crypto.scrypt(password, salt, 64, (err, derivedKey) =>
            err !== null
                ? reject(err)
                : resolve(`64:${salt.toString('base64')}:${derivedKey.toString('base64')}`)
        );
    });
}
```

**Ajustes obrigatórios ao portar**:
1. Trocar URL do endpoint para o do seu backend.
2. Ajustar o payload (alguns backends usam `email` em vez de `username`, JWT em header em vez de cookie, etc.).
3. Replicar **exatamente** o algoritmo de hash do backend. Se o backend usa `bcrypt`, a factory salva a senha já com bcrypt-hash.
4. Se o backend setar JWT em vez de cookie, armazene o token no `localStorage`/`sessionStorage` via `addInitScript`.

---

## 8. Factories de Dados (ORM direto)

### Cliente único — `lib/factories/prisma.ts`

```typescript
import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
});

export function getPrismaClient() {
    return prisma;
}

export {prisma};
```

### Padrão de factory — `lib/factories/<entidade>.ts`

```typescript
// Exemplo genérico: Organization (equivalente a Company, Tenant, Workspace)
import {randomBytes} from 'crypto';
import {uuidv7} from 'uuidv7';
import {prisma} from './prisma';

export type CreateOrganizationEntry = {
    name?: string;
    currency?: string;
    timeZone?: string;
};

export async function createTestOrganizations(entries: CreateOrganizationEntry[]) {
    const organizations = [];

    for (const entry of entries) {
        const uniqueSuffix = randomBytes(4).toString('hex');

        const organization = await prisma.organization.create({
            data: {
                id: uuidv7(),
                name: entry.name ?? `Test Org ${uniqueSuffix}`,
                currency: entry.currency ?? 'USD',
                timeZone: entry.timeZone ?? 'Pacific/Honolulu',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });

        organizations.push(organization);
    }

    return organizations;
}
```

### Factory de usuário com autenticação

```typescript
// lib/factories/user.ts
import {randomBytes} from 'crypto';
import {uuidv7} from 'uuidv7';
import {hashPassword} from '../auth';
import {createTestAccessProfiles} from './access-profile';
import {prisma} from './prisma';

export type CreateUserEntry = {
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    password?: string;
    globalRole?: 'SUPER_ADMIN' | 'OWNER' | 'NONE';
    organizationIds?: string[];
    accessProfileName?: string;
    permissions?: string[] | null;
};

export async function createTestUsers(entries: CreateUserEntry[]) {
    const users = [];
    for (const entry of entries) users.push(await createTestUser(entry));
    return users;
}

export async function createTestUser(entry: CreateUserEntry = {}) {
    const uniqueSuffix = randomBytes(4).toString('hex');
    const username = entry.username ?? `test-user-${uniqueSuffix}`;
    const password = entry.password ?? `${username}Pa$$w0rd`;
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
        data: {
            id: uuidv7(),
            username,
            email: entry.email ?? `test-${uniqueSuffix}@example.com`,
            firstName: entry.firstName ?? 'Test',
            lastName: entry.lastName ?? 'User',
            password: hashedPassword,
            globalRole: entry.globalRole ?? 'NONE',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    });

    if (entry.organizationIds) {
        for (const organizationId of entry.organizationIds) {
            await prisma.organizationUser.create({
                data: {organizationId, userId: user.id},
            });

            if (entry.permissions !== null) {
                await createTestAccessProfiles([
                    {
                        organizationId,
                        name: entry.accessProfileName ?? `${user.username}-profile`,
                        permissions: entry.permissions,
                        userId: user.id,
                    },
                ]);
            }
        }
    }

    // Retorna a senha em texto plano para uso nos testes.
    return {...user, password};
}
```

### Factory de perfil de acesso

```typescript
// lib/factories/access-profile.ts
import {uuidv7} from 'uuidv7';
import {prisma} from './prisma';

export type CreateAccessProfileEntry = {
    organizationId: string;
    name: string;
    permissions?: string[];
    userId?: string;
};

export async function createTestAccessProfiles(entries: CreateAccessProfileEntry[]) {
    const accessProfiles = [];

    for (const entry of entries) {
        const accessProfile = await prisma.accessProfile.create({
            data: {
                id: uuidv7(),
                organizationId: entry.organizationId,
                name: entry.name,
                permissions: entry.permissions,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });

        if (entry.userId) {
            await prisma.userAccessProfile.create({
                data: {
                    userId: entry.userId,
                    organizationId: entry.organizationId,
                    accessProfileId: accessProfile.id,
                },
            });
        }

        accessProfiles.push(accessProfile);
    }

    return accessProfiles;
}
```

### Factory composta — o "starter kit" do teste

```typescript
// lib/factories/organization-user.ts
import {createTestOrganizations} from './organization';
import type {CreateUserEntry} from './user';
import {createTestUsers} from './user';

export type CreateOrganizationUserEntry = {
    organizationName?: string;
    accessProfileName?: string;
    permissions?: string[];
    user?: CreateUserEntry;
};

export async function createTestOrganizationUser(entry: CreateOrganizationUserEntry = {}) {
    const [organization] = await createTestOrganizations([{name: entry.organizationName}]);

    const [user] = await createTestUsers([
        {
            ...(entry.user ?? {}),
            organizationIds: [organization.id],
            accessProfileName: entry.accessProfileName,
            permissions: entry.permissions,
        },
    ]);

    return {organization, user};
}
```

### `index.ts` — re-export tudo

```typescript
// lib/factories/index.ts
export * from './prisma';
export * from './organization';
export * from './user';
export * from './access-profile';
export * from './organization-user';
// ... uma linha por arquivo de factory
```

### Convenções de factory

- Nome: `createTest<Entidade>s` (plural, recebe array).
- IDs via `uuidv7()` — ordenação temporal natural.
- Toda entrada tem defaults sensatos para campos não informados.
- Suffix aleatório (`randomBytes(4).toString('hex')`) garante unicidade em paralelismo.
- Exportar tipo `Create<Entidade>Entry`.
- Uma factory por arquivo; `index.ts` re-exporta tudo.

---

## 9. Fixtures Customizadas — `fixtures/test.ts`

```typescript
import {test as base} from '@playwright/test';
import {login} from '@lib/auth';
import type {CreateOrganizationUserEntry} from '@lib/factories';
import {
    createTestOrganizationUser,
    createTestOrganizations,
    createTestUsers,
    getPrismaClient,
    // ... importar todas as factories do domínio
} from '@lib/factories';
import {SignInPage} from '@pages/auth/sign-in-page';
// ... importar todas as page objects
import {SidebarComponent} from '../components/sidebar/sidebar-component';

export {expect} from '@playwright/test';

type CustomFixtures = {
    // Infraestrutura
    db: ReturnType<typeof getPrismaClient>;
    isSmallScreen: boolean;
    isMediumScreen: boolean;
    isLargeScreen: boolean;

    // Factory fixtures
    createOrganizationUser: (
        options?: CreateOrganizationUserEntry & {autoLogin?: boolean}
    ) => ReturnType<typeof createTestOrganizationUser>;
    createOrganizations: typeof createTestOrganizations;
    createUsers: typeof createTestUsers;
    // ... uma entrada por factory

    // Component fixtures
    sidebar: SidebarComponent;

    // Page object fixtures
    signInPage: SignInPage;
    // ... uma entrada por page object
};

export const test = base.extend<CustomFixtures>({
    db: async ({}, use) => {
        await use(getPrismaClient());
    },
    isSmallScreen: async ({viewport}, use) => {
        await use(viewport ? viewport.width < 640 : false);
    },
    isMediumScreen: async ({viewport}, use) => {
        await use(viewport ? viewport.width >= 640 && viewport.width < 1024 : false);
    },
    isLargeScreen: async ({viewport}, use) => {
        await use(viewport ? viewport.width >= 1024 : false);
    },

    // Fixture especial: cria tenant + usuário + faz login automático
    createOrganizationUser: async ({page}, use) => {
        const wrappedFactory = async (
            options: CreateOrganizationUserEntry & {autoLogin?: boolean} = {}
        ) => {
            const result = await createTestOrganizationUser(options);

            if (options.autoLogin ?? true) {
                await login(page, {
                    username: result.user.username,
                    password: result.user.password,
                    tenantId: result.organization.id,
                });
            }

            return result;
        };

        await use(wrappedFactory);
    },

    createOrganizations: async ({}, use) => {
        await use(createTestOrganizations);
    },
    createUsers: async ({}, use) => {
        await use(createTestUsers);
    },

    // Component object
    sidebar: async ({page, isSmallScreen}, use) => {
        await use(new SidebarComponent(page, isSmallScreen));
    },

    // Page objects — um bloco por página
    signInPage: async ({page}, use) => {
        await use(new SignInPage(page));
    },
});
```

**Regras**:
- `createOrganizationUser` é a **porta de entrada** de 95% dos testes: cria tenant, cria usuário com permissões, loga.
- `autoLogin: false` só para testes que logam pela UI (sign-in específicos).
- Factories simples (`createOrganizations`, `createUsers`) só expõem a função já existente.
- Page objects são pré-instanciados — testes só injetam `{signInPage}` no parâmetro.

---

## 10. Padrão de Page Object

### Template

```typescript
// pages/<feature>/<pagina>-page.ts
import type {Locator, Page} from '@playwright/test';
import {expect} from '@fixtures/test';
import {BasePage} from '../base-page';

export class MyFeaturePage extends BasePage {
    readonly pageTitle: Locator;
    readonly submitButton: Locator;
    readonly cancelButton: Locator;
    readonly nameInput: Locator;

    constructor(page: Page) {
        super(page);
        this.pageTitle = page.getByRole('heading', {name: /my feature/i});
        this.submitButton = page.getByRole('button', {name: /save/i});
        this.cancelButton = page.getByRole('button', {name: /cancel/i});
        this.nameInput = page.getByRole('textbox', {name: /name/i});
    }

    async navigate(id?: string) {
        await this.page.goto(id ? `/my-feature/${id}` : '/my-feature');
    }

    async verifyPageLoaded() {
        await expect(this.pageTitle).toBeVisible();
        await expect(this.submitButton).toBeVisible();
    }

    // Métodos expõem AÇÕES DE NEGÓCIO, não interações isoladas.
    async fillForm(data: {name: string}) {
        await this.nameInput.fill(data.name);
    }

    async submit() {
        await this.submitButton.click();
    }
}
```

### Exemplo — SignIn Page

```typescript
// pages/auth/sign-in-page.ts
import type {Locator, Page} from '@playwright/test';
import {expect} from '@fixtures/test';
import {BasePage} from '@pages/base-page';

export class SignInPage extends BasePage {
    readonly usernameInput: Locator;
    readonly passwordInput: Locator;
    readonly signInButton: Locator;

    constructor(page: Page) {
        super(page);
        this.usernameInput = page.getByRole('textbox', {name: /username/i});
        this.passwordInput = page.getByRole('textbox', {name: /password/i});
        this.signInButton = page.getByRole('button', {name: /sign in/i});
    }

    async navigate() {
        await this.page.goto('/signin');
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL('/signin');
        await expect(this.usernameInput).toBeVisible();
        await expect(this.passwordInput).toBeVisible();
        await expect(this.signInButton).toBeVisible();
    }

    async signIn(username: string, password: string) {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.signInButton.click();
    }

    async verifyInvalidCredentialsError() {
        await this.verifyErrorMessage(this.usernameInput, 'Incorrect username or not registered');
        await this.verifyErrorMessage(this.passwordInput, 'Incorrect password');
    }
}
```

### Regras de Page Object

- Estende `BasePage`, implementa `navigate` e `verifyPageLoaded`.
- Locators são `readonly` e inicializados no construtor.
- **Priorize locators acessíveis**: `getByRole`, `getByLabel`, `getByText`, `getByPlaceholder`.
- Use regex com `/i` para permitir variações de caixa/whitespace.
- Evite `page.locator('css-selector')` — fragilidade e baixa legibilidade.
- Métodos expõem ações de negócio (`signIn`, `fillForm`, `submit`), não cliques brutos.
- Métodos de verificação começam com `verify` (`verifyPageLoaded`, `verifyInvalidCredentialsError`).

### Component Object (compartilhado entre páginas)

```typescript
// components/sidebar/sidebar-component.ts
import type {Locator, Page} from '@playwright/test';

export class SidebarComponent {
    readonly page: Page;
    readonly openButton: Locator;
    readonly closeButton: Locator;
    readonly isSmallScreen: boolean;

    constructor(page: Page, isSmallScreen: boolean) {
        this.page = page;
        this.openButton = page.getByRole('button', {name: /open menu/i});
        this.closeButton = page.getByRole('button', {name: /close menu/i});
        this.isSmallScreen = isSmallScreen;
    }

    async open() {
        if (this.isSmallScreen) await this.openButton.click();
    }

    async close() {
        if (this.isSmallScreen) await this.closeButton.click();
    }
}
```

Component objects **não** estendem `BasePage` — não são páginas, não têm URL.

---

## 11. Estrutura de um Teste

### Template

```typescript
// tests/<feature>/<acao>.test.ts
import {expect, test} from '@fixtures/test';

test.describe('Feature Name', () => {
    // 1. Permissões declaradas no topo do describe.
    const permissions = ['resource:view', 'resource:create'];

    // 2. Variáveis compartilhadas entre beforeEach e testes.
    let organization: {id: string};
    let items: Array<{id: string}>;

    test.beforeEach(async ({createOrganizationUser, createItems}) => {
        // 3. Setup via factories. Sempre criar tenant novo por teste.
        ({organization} = await createOrganizationUser({permissions}));

        items = await createItems([
            {organizationId: organization.id, name: 'Item A'},
            {organizationId: organization.id, name: 'Item B'},
        ]);
    });

    test('should do the happy path', async ({myFeaturePage}) => {
        await myFeaturePage.navigate();
        await myFeaturePage.verifyPageLoaded();
        // ... asserções
    });

    // 4. Teste espelho: usuário sem a permissão → access denied.
    test('should show access denied without permission', async ({
        page,
        myFeaturePage,
        createOrganizationUser,
    }) => {
        await createOrganizationUser({
            permissions: permissions.filter(p => p !== 'resource:view'),
        });
        await page.reload();
        await myFeaturePage.verifyAccessDenied();
    });

    // 5. Teste visual com tag @visual.
    test('should match snapshot', {tag: '@visual'}, async ({myFeaturePage}) => {
        await myFeaturePage.navigate();
        await myFeaturePage.verifyPageLoaded();
        await myFeaturePage.compareScreenshot('my-feature-default');
    });
});
```

### Exemplo — Sign-in

```typescript
import {test} from '@fixtures/test';

test.describe('Sign in', () => {
    test('should display the sign in page', {tag: '@visual'}, async ({signInPage}) => {
        await signInPage.navigate();
        await signInPage.verifyPageLoaded();
        await signInPage.compareScreenshot('sign-in-page');
    });

    test('should sign in with valid credentials', async ({signInPage, createOrganizationUser}) => {
        const {user} = await createOrganizationUser({
            autoLogin: false,
            permissions: ['home:view'],
        });

        await signInPage.navigate();
        await signInPage.signIn(user.username, user.password);
        await signInPage.verifySuccessfulSignIn();
    });

    test('should not sign in with invalid credentials', async ({signInPage, createOrganizationUser}) => {
        const {user} = await createOrganizationUser({autoLogin: false});

        await signInPage.navigate();
        await signInPage.signIn(user.username, 'invalid-password');
        await signInPage.verifyInvalidCredentialsError();
    });

    test('should not sign in with empty username', async ({signInPage, createOrganizationUser}) => {
        const {user} = await createOrganizationUser({autoLogin: false});

        await signInPage.navigate();
        await signInPage.signIn('', user.password);
        await signInPage.verifyRequiredErrorMessage(signInPage.usernameInput);
    });
});
```

### Controle de tempo

Testes que dependem de "agora" (expirações, timestamps renderizados):

```typescript
const fixedDate = new Date('2026-03-03T00:30:00.000Z');

test.beforeEach(async ({page}) => {
    await page.clock.setSystemTime(fixedDate);
});

test.afterEach(async ({page}) => {
    await page.clock.resume();
});
```

### Regras obrigatórias

- `const permissions = [...]` no topo do describe.
- Setup no `beforeEach` via fixtures factory.
- **Nunca** `page.locator('...')` no teste — sempre via page object.
- Cada teste cria sua própria org/tenant (isolamento em paralelo).
- Tag `@visual` em screenshots.
- Para todo endpoint protegido, teste o caso sem permissão.
- Use `page.clock` em vez de `Date.now` monkey-patching.

---

## 12. Testes Visuais

- Tag `@visual` separa testes de screenshot.
- Rodam em Docker para consistência de rendering.
- Baselines em `screenshots/` são **commitados** no repo.
- Cada viewport gera um baseline separado (`{arg}_{projectName}.png`).
- Use `mask: [locator]` para esconder partes dinâmicas (horários, IDs).
- Ajuste `maxDiffPixels` / `threshold` se a UI tem anti-aliasing variável.

```typescript
test('visual snapshot', {tag: '@visual'}, async ({myFeaturePage}) => {
    await myFeaturePage.navigate();
    await myFeaturePage.compareScreenshot('my-feature-page', {
        mask: [myFeaturePage.dynamicTimestampLocator],
        maxDiffPixels: 200,
    });
});
```

Atualizar baselines: `pnpm test:visual:update` (só permitido localmente/Docker, bloqueado em CI).

---

## 13. Docker para Testes Visuais

### `Dockerfile`

```dockerfile
FROM mcr.microsoft.com/playwright:v1.58.2-noble

WORKDIR /app
RUN npm install -g pnpm@9

# Arquivos de workspace
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.json ./

# Schema do ORM para o cliente Prisma ser gerado dentro do container
COPY apps/server/prisma ./e2e/prisma/

# Pacotes compartilhados que o e2e consome
# COPY packages/<shared> ./packages/<shared>/

COPY e2e/package.json ./e2e/
COPY e2e ./e2e/

RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    pnpm install --frozen-lockfile --filter <nome-do-pacote-e2e>...

WORKDIR /app/e2e

RUN pnpm exec prisma generate --schema=./prisma && rm -rf ./prisma
```

### `docker-compose.yml`

```yaml
name: <app>-e2e

services:
  e2e:
    container_name: ${COMPOSE_PROJECT_NAME}_playwright
    build:
      context: ..
      dockerfile: e2e/Dockerfile
      secrets:
        - npmrc
    environment:
      BASE_URL: ${BASE_URL:-http://host.docker.internal:5173}
      API_URL: ${API_URL:-http://host.docker.internal:3000}
      DATABASE_URL: ${DATABASE_URL:-postgresql://postgres:postgres@host.docker.internal:5432/db?schema=public}
      PLAYWRIGHT_HTML_HOST: 0.0.0.0
    volumes:
      - ./:/app/e2e/
      - /app/e2e/node_modules
    extra_hosts:
      - host.docker.internal:host-gateway
    ports:
      - "54321:54321"
      - "9323:9323"
    ipc: host

secrets:
  npmrc:
    file: ${NPMRC_FILE:-~/.npmrc}
```

---

## 14. Scripts do `package.json`

```json
{
  "name": "<app>-e2e",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "typecheck": "tsc",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "test": "docker compose run --rm --service-ports e2e pnpm playwright test",
    "test:local": "playwright test --grep-invert @visual",
    "test:visual": "pnpm test -- --grep @visual",
    "test:visual:update": "pnpm test:visual --update-snapshots",
    "test:headed": "playwright test --headed",
    "test:ui": "playwright test --ui",
    "test:debug": "playwright test --debug",
    "test:chrome": "pnpm test:local --project=desktop-chrome",
    "test:mobile": "pnpm test:local --project=tablet-chrome --project=mobile-chrome",
    "test:failed": "pnpm test:local --last-failed",
    "docker:test:ui": "pnpm test -- --ui-port=54321 --ui-host=0.0.0.0",
    "docker:build": "docker compose build",
    "report": "playwright show-report",
    "codegen": "playwright codegen",
    "install:browsers": "playwright install --with-deps"
  }
}
```

---

## 15. ESLint para testes

```javascript
// eslint.config.mjs
import path from 'node:path';
import {includeIgnoreFile} from '@eslint/compat';
import playwright from 'eslint-plugin-playwright';
import {defineConfig} from 'eslint/config';

const gitignorePath = path.resolve('.', '.gitignore');

export default defineConfig([
    includeIgnoreFile(gitignorePath),
    {
        files: ['tests/**'],
        extends: [playwright.configs['flat/recommended']],
        rules: {
            // Page objects fazem asserções internas; o teste pode não ter expect direto.
            'playwright/expect-expect': 'off',
        },
    },
    {
        files: ['fixtures/test.ts'],
        rules: {
            // O padrão `async ({}, use) => ...` do Playwright.
            'no-empty-pattern': 'off',
        },
    },
]);
```

---

## 16. Checklist de Implementação para o Agente

Ordem recomendada:

1. **Scaffold** — criar estrutura da Seção 3 e `tsconfig.json` da Seção 4.
2. **`playwright.config.ts`** — copiar Seção 5, ajustar `webServer` para os comandos e portas do app.
3. **`pages/base-page.ts`** — copiar Seção 6 sem alterar a interface. Remover helpers que não se aplicam (ex.: `fillDurationInput` se sua UI não tem inputs de duração).
4. **`lib/auth.ts`** — copiar Seção 7. **Ajustar obrigatoriamente**:
   - URL do endpoint de sign-in.
   - Payload (nomes dos campos).
   - Algoritmo de hash para bater com o backend.
   - Método de persistência do token (cookie, localStorage, sessionStorage).
5. **`lib/factories/prisma.ts`** — copiar Seção 8.
6. **Mapear entidades** do domínio de destino:
   - Identificar entidade "tenant" (Organization, Company, Workspace, Account, etc.).
   - Identificar entidade User e relação User↔Tenant.
   - Identificar modelo de permissões (AccessProfile, Role, Policy).
7. **Implementar factories base** seguindo Seção 8:
   - `organization.ts` (ou equivalente).
   - `access-profile.ts` (ou equivalente).
   - `user.ts` com hash compatível.
   - `organization-user.ts` (factory composta).
8. **Implementar factories de domínio** — para cada entidade que testes vão pré-popular, criar `lib/factories/<entidade>.ts` no padrão da Seção 8.
9. **`lib/factories/index.ts`** — re-exportar todas.
10. **`fixtures/test.ts`** — Seção 9. Registrar:
    - `db`, viewport helpers.
    - `createOrganizationUser` com wrapper de auto-login.
    - Todas as factories.
    - Todas as page objects e component objects.
11. **Page objects**:
    - Começar por `SignInPage` (Seção 10).
    - Criar uma page object por tela relevante, sempre estendendo `BasePage`.
    - Locators acessíveis no construtor; métodos expõem ações de negócio.
12. **Testes de sign-in** (Seção 11) — validar que login pela UI e verificação de erros funcionam antes de ir para o domínio.
13. **Testes por feature**:
    - Um arquivo por ação (`create.test.ts`, `view.test.ts`, `update.test.ts`, `delete.test.ts`).
    - Declarar `permissions` no topo do describe.
    - Setup no `beforeEach`.
    - Sempre um teste "access denied" para endpoints protegidos.
14. **Docker + docker-compose** (Seção 13) — para visuais.
15. **`package.json` scripts** (Seção 14) e **ESLint** (Seção 15).
16. **README curto** com os comandos principais.

---

## 17. Regras Não-Óbvias Importantes

| # | Regra | Motivo |
|---|---|---|
| 1 | Um tenant novo por teste via `createOrganizationUser` | Zero cross-contamination em `fullyParallel: true` |
| 2 | Login via API, não UI | Velocidade (~10x) e estabilidade |
| 3 | Teste espelho "sem permissão → access denied" para todo endpoint protegido | Cobertura de autorização |
| 4 | Nunca `page.locator()` em arquivo de teste | Manutenibilidade |
| 5 | Locators acessíveis (`getByRole`/`getByLabel`) > CSS selectors | Resistente a refactors de estilo |
| 6 | `uuidv7()` em vez de `uuid v4` | Ordenação temporal nativa nos inserts |
| 7 | `timezoneId` e `locale` fixos no config | Evita flakes de formatação |
| 8 | Factories não devem falhar com dados padrão | Defaults sensatos para todo campo |
| 9 | Visual tests só em Docker | Rendering varia entre hosts |
| 10 | Tag `@visual` obrigatória para screenshots | Separação entre rodadas Docker e local |
| 11 | `page.clock.setSystemTime` em vez de mockar `Date` | API oficial do Playwright |
| 12 | `addInitScript` para estado inicial de localStorage | Roda antes de qualquer JS da página |
| 13 | `fullPage: true` + `animations: 'disabled'` em screenshots | Consistência |
| 14 | `updateSnapshots: 'none'` em CI | Impede criar baseline ruim acidentalmente |
| 15 | Baselines commitados no repo (`screenshots/`) | Review explícito de mudanças visuais |
| 16 | Hash de senha da factory deve bater com o do backend | Senão login por API falha |
| 17 | Retornar senha em texto plano do `createTestUser` | Testes precisam dela para login |
| 18 | `reuseExistingServer: true` no webServer | Dev já tem app rodando, não derrubar |
| 19 | Não mockar o backend | Suite valida stack completo (UI + API + DB) |
| 20 | Container Prisma precisa do schema copiado no build | Sem ele, cliente não gera |

---

## 18. Adaptações Comuns por Stack

| Cenário | Ajuste |
|---|---|
| Backend usa JWT em header Authorization | Salvar token em `localStorage` via `addInitScript` em vez de confiar em cookie |
| Backend usa bcrypt | Trocar `scrypt` em `hashPassword` por `bcrypt.hash(password, 10)` |
| Backend tem endpoint público de registro | Substituir `createTestUser` por uma chamada HTTP a `POST /api/v1/register` |
| ORM não é Prisma | Trocar factories para Drizzle/TypeORM/Knex; interface (`createTest<X>s(entries)`) fica igual |
| Sem multi-tenancy | Remover `organization`/`tenantId`; `createUser` vira a factory-base |
| Permissões por role simples | Trocar `permissions: string[]` por `role: 'ADMIN' \| 'USER'` na factory de user |
| Frontend não é SPA | Ajustar `verifyPageLoaded` para não depender de `waitForURL` se usar navegação tradicional |
| Sem design system de alerts com `role="alert"` | Ajustar `verifyNotification` para o seletor do seu toast |
| Tabela sem sub-rows responsivas | Remover `expandTableRowIfNeeded` e `getTableSubRow` do `BasePage` |

---

## 19. Saída Esperada

Ao fim da implementação, o agente deve ter:

- Suite E2E isolada em `e2e/` com todos os arquivos das Seções 3–15.
- Pelo menos um teste de sign-in passando (valida auth + factories + page objects + fixtures).
- Pelo menos uma feature de domínio com: `create`, `view`, `update`, `delete`, cada um com teste de permissão negada.
- Pelo menos um teste com tag `@visual` e baseline commitado.
- `pnpm test:local` passa verde.
- `pnpm typecheck` e `pnpm lint` passam verde.
- Docker build funciona e `pnpm test:visual` roda.
