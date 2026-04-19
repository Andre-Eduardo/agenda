# Automo — Agenda Saúde

Sistema multi-tenant de gestão clínica (hospitalar/ambulatorial) — monorepo pnpm com NestJS backend e React/Vite frontend.

## Arquitetura

- **Backend**: NestJS v11 + TypeScript — porta 3000
- **Frontend**: React + Vite (SWC) + TanStack Router + TanStack Query + Mantine UI — porta 5000
- **Banco**: PostgreSQL via Prisma ORM v6
- **Auth**: JWT com signed cookies
- **Package Manager**: pnpm workspaces

## Estrutura

```
apps/
  server/          - NestJS backend
    src/
      application/ - Controllers, DTOs, Application Services
      domain/      - Entidades, value objects, eventos, repositórios
      infrastructure/ - Prisma repos, config, mappers, storage, AI
    prisma/        - Schema Prisma + migrações
  web/             - React/Vite frontend
    src/
      lib/client/  - Shim local @agenda-app/client (hooks TanStack Query)
      views/
        layouts/   - AuthLayout, StackedLayout
        modules/   - Páginas por módulo (auth, dashboard, patient, appointment, etc.)
      store/       - Zustand appStore (auth state)
      utils/       - apiTypes (PaginatedResult), etc.
```

## Rotas Backend (prefixo /api/v1/)

- `POST /auth/sign-in` — login (username + password)
- `POST /auth/sign-out` — logout
- `GET  /user/me` — usuário autenticado
- `GET/POST /patients` — listagem e criação de pacientes
- `GET/PUT /patients/:id` — detalhe e edição
- `GET /patients/:id/clinical-profile` — perfil clínico
- `GET/POST /patients/:id/alerts` — alertas do paciente
- `GET/POST /patients/:id/forms/:formId` — formulários dinâmicos
- `GET/POST /appointments` — consultas
- `PATCH /appointments/:id/cancel` — cancelar consulta
- `GET/POST /records` — prontuários/evoluções
- `GET/POST /professionals` — profissionais
- `GET/POST /form-templates` — modelos de formulário
- `GET/POST /clinical-chat/sessions` — sessões de chat clínico IA
- `POST /clinical-chat/sessions/:id/chat` — enviar mensagem
- `GET /clinical-chat/sessions/:id/messages` — listar mensagens
- `GET /clinical-chat/context/snapshot/:patientId` — snapshot clínico

## Módulo @agenda-app/client (shim local)

Localizado em `apps/web/src/lib/client/index.ts`, mapeado via alias Vite.
Contém todos os hooks TanStack Query para comunicação com a API REST.

Alias em `apps/web/vite.config.ts`:
```ts
resolve: { alias: { '@agenda-app/client': path.resolve(__dirname, './src/lib/client/index.ts') } }
```

## Workflows

- **Backend API**: `cd apps/server && pnpm run prisma:generate && pnpm run prisma:migrate && NODE_ENV=development NODE_OPTIONS='--experimental-global-webcrypto' npx nest start --watch`
- **Start application**: `cd apps/web && pnpm run dev`

Frontend disponível em `$REPLIT_DEV_DOMAIN`, API proxiada em `/api`.

## Credenciais de teste

- **Usuário**: `admin`
- **Senha**: `Admin@123456`

## Correções aplicadas

1. `ai-provider.module.ts` — removido OpenRouterChatProvider dos providers diretos (factory-only)
2. `compression`/`cookieParser` imports corrigidos para estilo default (incompatibilidade SWC + CJS)
3. `AuthLayout` e `login` — adicionados exports `Route` via `createFileRoute`
4. `StackedLayout` — adicionado export `Route` via `createFileRoute('/_stackedLayout')`
5. Migração `20260415000000_scope_patient_document_id_to_professional` — resolvida como applied (coluna já existia em outro estado)
6. Shim `@agenda-app/client` criado localmente com todos os hooks utilizados pelas 17+ páginas frontend
7. Endpoint `/user/me` corrigido (controller é `user`, não `users`)
