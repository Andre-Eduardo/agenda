# Panda CSS Migration Plan

**Status**: Em andamento  
**Última atualização**: 2026-06-30

## Objetivo

Migrar o frontend de Tailwind CSS v4 + CSS Modules (`@apply`) para Panda CSS (zero-runtime CSS-in-JS), página por página, mantendo Tailwind ativo durante a transição (coexistência).

## Abordagem

Para cada página/componente:
1. Ler o `styles.module.css` correspondente
2. Reescrever o `.tsx` importando `css`, `cx`, `cva` de `@/styled-system/css`
3. Definir constantes CSS no topo do arquivo (nível de módulo) substituindo cada classe CSS Module
4. Remover o `styles.module.css`

Nunca usar `clsx` ou `cva` de `class-variance-authority` — usar exclusivamente as versões do Panda.

## Padrões estabelecidos

### Imports
```tsx
import {css, cx, cva} from '@/styled-system/css';
```

### Tokens de cor
```ts
color: 'text.primary'        // --color-text-primary
bg: 'bg.card'                // --color-bg-card
borderColor: 'border'        // --color-border (DEFAULT)
borderColor: 'border.hover'  // --color-border-hover
color: 'primary'             // --color-primary (DEFAULT)
bg: 'primary.surface'        // --color-primary-surface
color: 'primary.text'        // --color-primary-text
borderColor: 'primary.border'
bg: 'ai.bg' / color: 'ai.text' / bg: 'ai.badgeBg'
color: 'success' / 'warning' / 'danger' / 'info'
bg: 'success.surface' / 'danger.surface' etc.
```

### Opacity modifier
```ts
borderColor: 'success/40'   // color-mix 40%
bg: 'danger/30'
bg: 'primary/10'
```

### Valores arbitrários (dentro de css())
```ts
fontSize: '[11px]'          // arbitrary
gap: '[14px]'
py: '[9px]'
top: '[calc(100%+6px)]'
gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'
```

### Breakpoints responsive
```ts
display: {base: 'none', sm: 'block'}
gridTemplateColumns: {base: '1fr', lg: '1fr 340px'}
```

### Pseudo-condições
```ts
_hover: { bg: 'bg.surface' }
_focus: { outline: 'none' }
_focusWithin: { borderColor: 'primary' }
_last: { borderBottomWidth: '0' }
_first: { pt: '0' }
_placeholder: { color: 'text.tertiary' }
_dark: { ... }   // .dark & — dark mode
```

### Parent-hover → child (substituição de group-hover / CSS nesting)
```tsx
// No elemento pai, adicionar data attribute:
<div data-record-row className={rowCss}>
  <p className={summaryCss}>...</p>
</div>

// No CSS do filho:
const summaryCss = css({
  color: 'text.secondary',
  '[data-record-row]:hover &': { color: 'text.primary' },
});
```

### divide-y equivalente
```ts
'& > * + *': { borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: 'border' }
```

### space-y equivalente
```ts
// Preferir flex + gap:
display: 'flex', flexDirection: 'column', gap: '2'
```

### Tamanho quadrado (size-N)
```ts
w: '8', h: '8'   // size-8
w: '4', h: '4'   // size-4
```

### Media query customizado
```ts
'@media (max-width: 1100px)': { gridTemplateColumns: 'repeat(1, minmax(0, 1fr))' }
```

### lineClamp
```ts
lineClamp: '2'
```

### fontVariantNumeric
```ts
fontVariantNumeric: 'tabular-nums'
```

### CVA com Panda
```ts
import {cva} from '@/styled-system/css';

const badge = cva({
  base: { display: 'inline-flex', ... },
  variants: {
    tone: {
      primary: { bg: 'primary.surface', color: 'primary.text' },
      success: { bg: 'success.surface', color: 'success' },
    },
  },
  defaultVariants: { tone: 'primary' },
});

// Uso:
<span className={badge({tone: 'success'})}>
```

### Alternativa ao CVA para boolean variants
```ts
// Usar cx() ao invés de CVA:
const rootBase = css({ display: 'flex', ... });
const rootDone = css({ bg: 'bg.surface' });

<div className={cx(rootBase, isDone && rootDone)}>
```

---

## Progresso

### Infraestrutura (concluído)

| # | Tarefa | Status |
|---|--------|--------|
| T1 | Instalar `@pandacss/dev ^1.11.4` | ✅ |
| T2 | Configurar PostCSS (`postcss.config.cjs`) | ✅ |
| T3 | Criar `panda.config.ts` com todos os tokens | ✅ |
| T4 | Executar `panda codegen` → `src/styled-system/` | ✅ |
| T5 | Adicionar `@layer reset, base, tokens, recipes, utilities` no `globals.css` | ✅ |
| T6–T9 | Tokens de cor, tipografia, radius, shadow, motion, globalCss | ✅ |

### Páginas (em andamento)

| # | Página | Arquivo TSX | CSS Module | Status |
|---|--------|-------------|------------|--------|
| T10 | `welcome/pages/index` | ✅ migrado | ✅ deletado | ✅ |
| T11 | `auth/pages/login` | ✅ migrado | ✅ deletado | ✅ |
| T12 | `dashboard/pages/index` | ✅ migrado | ✅ deletado | ✅ |
| T13 | `patients/pages/index` | ✅ migrado | ✅ deletado | ✅ |
| T14 | `patients/pages/new` | ✅ migrado | ✅ deletado | ✅ |
| T15 | `patients/pages/edit` | ✅ migrado | — (usava new/styles) | ✅ |
| T16 | `patients/pages/detail` | ✅ migrado | ✅ deletado | ✅ |
| T17 | `patients/pages/records/new` | ⏳ pendente | ⏳ pendente | ❌ |
| T18 | `patients/pages/records/detail` | ⏳ pendente | ⏳ pendente | ❌ |
| T19 | `settings/pages/index` | ⏳ pendente | ⏳ pendente | ❌ |
| T20 | `appointments/pages/index` | ⏳ pendente | ⏳ pendente | ❌ |
| T21 | `agenda/pages/index` | ⏳ pendente | ⏳ pendente | ❌ |

### Layouts e componentes globais

| # | Componente | Arquivo | CSS Module | Status |
|---|------------|---------|------------|--------|
| T22 | `StackedLayout` | `views/layouts/StackedLayout/` | ⏳ | ❌ |
| T23 | `AuthLayout` | `views/layouts/AuthLayout/` | (sem CSS module) | ❌ |
| T24 | `views/components/Page` | `Page/index.tsx` | ⏳ | ❌ |
| T25 | `views/components/Breadcrumbs` | | ⏳ | ❌ |
| T26 | `views/components/EmptyState` | | ⏳ | ❌ |
| T27 | `views/components/ListToolbar` | | ⏳ | ❌ |

### Componentes clínicos e UI

| # | Componente | Status |
|---|------------|--------|
| T28 | `components/clinical/*` (AIBlock, ConfidenceIndicator, etc.) | ❌ |
| T29 | Decidir abordagem shadcn/ui (provavelmente manter Tailwind inline ou migrar) | ❌ |
| T30 | `components/ui/box` | ❌ |
| T31 | Componentes UI de formulário (Input, Field, Select, Textarea…) | ❌ |
| T32 | Componentes UI de overlay (Dialog, Sheet, Popover, Dropdown…) | ❌ |
| T33 | Componentes UI de display (Badge, Card, Skeleton, StatTile…) | ❌ |
| T34 | Componentes UI de navegação/layout (Tabs, Breadcrumb, PageHeader…) | ❌ |

### Finalização

| # | Tarefa | Status |
|---|--------|--------|
| T35 | Remover todos os `.module.css` restantes | ❌ |
| T36 | Remover Tailwind CSS v4 (`@tailwindcss/vite`) e `tw-animate-css` do projeto | ❌ |
| T37 | Build final, verificação de tipos e limpeza | ❌ |

---

## Próximo passo

Continuar em **T17**: `patients/pages/records/new`

Arquivos a ler:
- `apps/web/src/views/modules/patients/pages/records/new/styles.module.css`
- `apps/web/src/views/modules/patients/pages/records/new/index.tsx`

---

## Arquivos de referência

- `apps/web/panda.config.ts` — configuração completa com todos os tokens
- `apps/web/postcss.config.cjs` — plugin Panda CSS para PostCSS
- `apps/web/src/app/globals.css` — `@layer reset, base, tokens, recipes, utilities` adicionado
- `apps/web/src/styled-system/` — código gerado pelo Panda (não editar manualmente)

---

## Comando para retomar geração de código (se o styled-system ficar desatualizado)

```bash
pnpm -F @agenda-app/app panda:codegen
```
