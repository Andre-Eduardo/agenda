# Automo — Monorepo

Healthcare/agenda management application. Monorepo gerenciado com **pnpm workspaces**.

## Estrutura

```
apps/
  server/   — NestJS backend (Node >= 18, TypeScript 5.8)
  web/       — React 19 frontend (TypeScript 6, Vite 6)
packages/
  client/         — API client gerado por Orval (React Query + Axios)
  value-objects/  — Value objects imutáveis compartilhados
docs/             — Documentação de arquitetura e padrões
```

## Comandos raiz

```bash
pnpm install                     # instalar dependências
pnpm run start:dev:full          # server + web em paralelo (concurrently)
pnpm run typecheck               # tsc em todos os pacotes
pnpm run build                   # build de todos os pacotes
pnpm run lint                    # lint em todos os pacotes
```

## Comandos por workspace

```bash
# Backend
pnpm -F @agenda-app/server start:dev          # dev com watch
pnpm -F @agenda-app/server test               # testes unitários (Jest)
pnpm -F @agenda-app/server test:integration   # BDD (Cucumber.js)
pnpm -F @agenda-app/server openapi:generate   # gera openapi.json
pnpm -F @agenda-app/server prisma:generate    # gera cliente Prisma
pnpm -F @agenda-app/server prisma:migrate     # aplica migrations

# Frontend
pnpm -F @agenda-app/app dev                   # dev server (Vite)
pnpm -F @agenda-app/app build                 # build de produção
pnpm -F @agenda-app/app typecheck             # checagem de tipos

# Pacotes
pnpm -F @agenda-app/client generate           # regenera cliente Orval (requer openapi.json)
pnpm -F @agenda-app/client build
pnpm -F @agenda-app/value-objects build
```

## Fluxo de geração de código

Sempre que a API do servidor mudar:
1. `pnpm -F @agenda-app/server openapi:generate` → atualiza `apps/server/openapi.json`
2. `pnpm -F @agenda-app/client generate` → regenera hooks React Query em `packages/client`
3. **Nunca escreva chamadas de API à mão no frontend** — use o client gerado.

## Tech stack resumido

| Camada | Tecnologia |
|--------|-----------|
| Backend | NestJS 11 + Prisma 6 + PostgreSQL |
| Frontend | React 19 + TanStack Router v1 + React Query v5 + Zustand v5 |
| UI | @ecxus/ui (Mantine 7 internamente) + CSS-in-JS via BoxStyle |
| Forms | React Hook Form + Zod |
| i18n | i18next (pt-BR padrão, en-US, es-ES) |
| Testes | Jest (unit) + Cucumber.js BDD (integração) |
| Package manager | pnpm >= 9 |

## Documentação de referência

- `docs/architecture-overview.md` — Clean Architecture, DDD, camadas
- `docs/backend-style-guide.md` — convenções de nomenclatura, DTOs, controllers
- `docs/type-safety-patterns.md` — **regras obrigatórias sobre casts, enum converters, JSON Prisma**
- `docs/service-patterns.md` — BaseApplicationService, Command, mappers
- `docs/testing-patterns.md` — testes unitários (Jest + jest-mock-extended)
- `docs/integration-test-patterns.md` — BDD (Cucumber.js), isolamento, referências
- `docs/frontend/` — arquitetura, roteamento, auth, state, forms, i18n

## Type safety (resumo)

Zero casts em `src/` do server fora de `__tests__/`. Para qualquer conversão entre Prisma e domínio, use os helpers de `@domain/@shared/utils`:

```typescript
import {toEnum, toEnumOrNull, toEnumArray} from '@domain/@shared/utils';
```

Detalhes e exceções autorizadas: [`docs/type-safety-patterns.md`](docs/type-safety-patterns.md).
