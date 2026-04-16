# Linting e Typecheck

## Visão geral

O monorepo usa **oxlint** como linter principal e **oxfmt** como formatter em todos os workspaces. TypeScript (via `tsc`) é responsável pela checagem de tipos. Cada workspace tem sua própria configuração, todas estendendo uma base compartilhada na raiz.

---

## Ferramentas

| Ferramenta | Versão | Propósito |
|---|---|---|
| **oxlint** | `^1.56.0` | Linter rápido (Rust), substitui ESLint no CI |
| **oxfmt** | `^0.41.0` | Formatter de código |
| **oxlint-tsgolint** | `^0.17.0` | Habilita regras TypeScript type-aware no oxlint |
| **tsc** | — | Checagem de tipos estrita (sem emissão) |
| **gherkin-lint** | — | Lint de arquivos `.feature` (Cucumber BDD) — somente server |

---

## Scripts disponíveis

Todos os scripts abaixo funcionam tanto na raiz (via `-r` recursivo) quanto dentro de cada workspace diretamente.

| Comando raiz | O que faz |
|---|---|
| `pnpm lint` | Executa `oxlint && oxfmt --check` em todos os workspaces |
| `pnpm lint:fix` | Executa `oxlint --fix && oxfmt` em todos os workspaces |
| `pnpm code-check` | Lint com type-check completo — mais lento, ideal para CI |
| `pnpm typecheck` | `tsc --noEmit` em todos os workspaces |
| `pnpm build` | Build completo de todos os workspaces |

### Diferença entre `lint` e `code-check`

- **`lint`**: rápido, sem type-awareness. Use durante desenvolvimento.
- **`code-check`**: habilita `--type-check` no oxlint (requer `tsconfig.json` válido). Use em CI ou antes de abrir PR. No server, também executa `gherkin-lint` nos arquivos `.feature`.

```bash
# Desenvolvimento: verificação rápida
pnpm lint

# Antes de commitar / CI
pnpm code-check && pnpm typecheck
```

---

## Estrutura de configuração

```
oxlint-base.json          ← base compartilhada (todas as regras comuns)
apps/
  server/.oxlintrc.json   ← estende base + regras NestJS/Node
  web/.oxlintrc.json      ← estende base + regras React/JSX/a11y
packages/
  client/.oxlintrc.json   ← estende base + regras relaxadas (código gerado)
  value-objects/.oxlintrc.json ← estende base + restrição bignumber.js
```

### `oxlint-base.json` (raiz)

Define as regras padrão para todo o monorepo:

- **Correctness**: regras sobrepostas com TypeScript desligadas (`getter-return`, `no-const-assign`, etc.)
- **Suspicious**: shadow de variáveis configurado para ignorar type/value shadows (necessário no TypeScript)
- **Pedantic**: `prefer-nullish-coalescing`, `return-await` em try-catch, `ban-ts-comment`
- **Style**: `arrow-body-style`, `prefer-destructuring`, `prefer-const`
- **Restriction**: `no-bitwise`, `no-empty`, `no-var`, `no-void`, proibição de `isFinite`/`isNaN` globais
- **jsPlugins**: `@eslint-community/eslint-comments`, `@stylistic`, `sort-export-all`
- **Testes** (override): regras Jest habilitadas para arquivos `*.test.ts`, `*.spec.ts`, `__tests__/**`

---

## Regras específicas por workspace

### `apps/server` — NestJS/Node

```jsonc
// .oxlintrc.json
{
  "env": { "builtin": true, "es2016": true },
  "options": { "typeAware": true, "denyWarnings": true }
}
```

Override para `src/**/*.ts`:
- `@typescript-eslint/no-unsafe-declaration-merging: off` — necessário para o padrão de DI do NestJS onde interfaces e abstract classes são mergeadas para permitir injeção sem `@Inject()`.
- `no-restricted-imports: bignumber.js` — use o value object `BigDecimal` em vez de `bignumber.js` diretamente.

### `apps/web` — React/Vite

Adiciona plugins `react` e `jsx-a11y` ao oxlint:

- **Acessibilidade**: `jsx-a11y/label-has-associated-control`, `jsx-a11y/alt-text`, etc.
- **React**: `react/no-array-index-key`, `react/jsx-no-constructed-context-values`, `react/button-has-type`
- **Import React**: proibido `import React from 'react'` — use desestruturação
- **Globals do browser**: `window.*` obrigatório (`addEventListener`, `location`, `history`, etc.)
- **Type imports**: `@typescript-eslint/consistent-type-imports: error`
- `src/routeTree.gen.ts` é ignorado (arquivo gerado automaticamente pelo TanStack Router)

### `packages/client` — Código gerado (Orval)

Regras relaxadas para código gerado:
- `arrow-body-style: off`, `import/no-duplicates: off`, `no-nested-ternary: off`
- `sort-export-all/sort-export-all: off`
- `reportUnusedDisableDirectives: off` (o Orval pode gerar diretivas desnecessárias)

### `packages/value-objects` — Value objects compartilhados

- Override: proibição de importar `bignumber.js` diretamente em `src/**/*.ts` (use `BigDecimal`)
- Exceção: `src/models/big-decimal.ts` (onde `BigDecimal` é implementado) pode importar `bignumber.js`

---

## TypeScript (`tsc`)

### `tsconfig.json` (raiz)

Configuração base herdada por todos os workspaces:

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "emitDecoratorMetadata": true,   // NestJS
    "experimentalDecorators": true,  // NestJS
    "noEmit": true,                  // checagem apenas, sem gerar arquivos
    "paths": {
      "@agenda-app/*": ["packages/*/src"]  // alias para pacotes internos
    }
  }
}
```

### Workspaces e seus tsconfigs

| Workspace | Herda raiz? | Build config |
|---|---|---|
| `apps/server` | Sim | `tsconfig.build.json` — emite para `dist/`, exclui testes |
| `apps/web` | Não (config própria) | Via Vite (usa `tsc` só para typecheck) |
| `packages/client` | Não (ESNext) | Emite para `dist/` com declarações `.d.ts` |
| `packages/value-objects` | Não (ESNext) | Emite para `dist/` com declarações `.d.ts` |

O server estende o tsconfig raiz e adiciona path aliases internos:

```jsonc
// apps/server/tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "paths": {
      "@application/*": ["./src/application/*"],
      "@domain/*": ["./src/domain/*"],
      "@infrastructure/*": ["./src/infrastructure/*"]
    }
  }
}
```

---

## CI / Fluxo recomendado

```bash
# 1. Verificação rápida (desenvolvimento)
pnpm lint
pnpm typecheck

# 2. Verificação completa (antes de PR)
pnpm code-check
pnpm typecheck
pnpm build

# 3. Workspace específico
pnpm -F @agenda-app/server code-check
pnpm -F @agenda-app/app lint:fix
```
