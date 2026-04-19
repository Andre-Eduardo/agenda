# @agenda-app/e2e

Suite de testes E2E baseada em Playwright + TypeScript, seguindo o padrão do
[`docs/E2E_BLUEPRINT.md`](../docs/E2E_BLUEPRINT.md).

Escopo atual: **apenas navegação e carregamento das páginas existentes**. Demais
cenários (CRUD, permissões, snapshots visuais) serão adicionados depois.

## Pré-requisitos

- PostgreSQL rodando com o banco `agenda` (ver `apps/server/.env`).
- Dependências instaladas: `pnpm install` na raiz do monorepo.
- Browsers do Playwright: `pnpm -F @agenda-app/e2e install:browsers`.
- Cliente Prisma gerado a partir do schema do server:
  `pnpm -F @agenda-app/e2e prisma:generate`.

Não é preciso subir server/web manualmente — a config faz isso (com
`reuseExistingServer: true`, se já estiverem de pé eles são reusados).

## Comandos principais

```bash
# Rodar todos os testes (sem visuais)
pnpm -F @agenda-app/e2e test:local

# Apenas navegação (diretório tests/navigation)
pnpm -F @agenda-app/e2e test:nav

# Somente no viewport desktop
pnpm -F @agenda-app/e2e test:chrome

# Modo UI interativo
pnpm -F @agenda-app/e2e test:ui

# Debug
pnpm -F @agenda-app/e2e test:debug
```

## Variáveis de ambiente

| Variável | Default | Uso |
|----------|---------|-----|
| `BASE_URL` | `http://localhost:5000` | Frontend (Vite dev server) |
| `API_URL` | `http://localhost:3000` | Backend NestJS |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/agenda` | Conexão Prisma das factories |

## Estrutura

```
e2e/
├── tests/             Tests por feature (navigation/*.test.ts, auth/*.test.ts)
├── pages/             Page Objects (um por tela, estendendo BasePage)
├── fixtures/test.ts   Fixtures customizadas (db, factories, page objects)
├── lib/
│   ├── auth.ts        Login via API + helpers de senha (scrypt compatível com o server)
│   └── factories/     Factories Prisma (user/professional/patient)
└── playwright.config.ts
```

## Autenticação nos testes

- Login por chamada HTTP direta em `POST /api/v1/auth/sign-in` (não pela UI).
- Hash de senha: **scrypt** no formato `64:<salt-base64>:<hash-base64>` — idêntico ao
  backend ([`obfuscated-password.vo.ts`](../apps/server/src/domain/user/value-objects/obfuscated-password.vo.ts)).
- Cookie `session.token` é persistido automaticamente pelo `page.request.post`.

## Adicionando uma página nova

1. Criar um page object em `pages/<feature>/<pagina>-page.ts` estendendo `BasePage`
   e implementando `navigate()` e `verifyPageLoaded()`.
2. Registrar a fixture em `fixtures/test.ts`.
3. Adicionar um teste em `tests/navigation/<feature>.test.ts` com `navigate()` +
   `verifyPageLoaded()`.
