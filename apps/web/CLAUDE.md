# Web — @agenda-app/app

React 19 + TypeScript 6 + Vite 6 (SWC). **Tailwind CSS v4 + shadcn/ui + Radix UI**.

> **Fonte canônica de design:** [`docs/frontend/design-system.md`](../../docs/frontend/design-system.md). Sempre que houver conflito entre este arquivo e a documentação em `docs/frontend/`, a documentação vence.

## Estrutura de pastas

```
src/
  main.tsx              — entry point (importa fontes + globals.css)
  App.tsx               — providers raiz (ThemeProvider + QueryClientProvider + RouterProvider)
  routeTree.gen.ts      — GERADO automaticamente pelo TanStack Router (não editar)
  app/
    globals.css         — tokens CSS via @theme + :root/.dark (design-system.md §11)
  components/
    ui/                 — componentes shadcn (button, card, dialog, …) + Box primitivo
      box/              — primitivo polimórfico (Box + box.module.css)
    clinical/           — componentes clínicos customizados (AIBlock, ConfidenceIndicator, …)
    agenda/             — componentes de agenda (AgendaCalendar)
  hooks/                — hooks globais: useCan, useDisclosure, useMergeRefs, useMediaQuery, …
  lib/
    utils.ts            — helper cn() (clsx + tailwind-merge)
  store/                — Zustand stores (appStore — auth, colorMode)
  translations/         — configuração i18next
  utils/                — helpers TS puros: aria.ts, debounce.ts, mapValues.ts, …
  views/
    components/         — componentes reutilizáveis globais (Page, FormActions, Can, …)
    layouts/            — AuthLayout, StackedLayout
    pages/              — ErrorPage, NotFoundPage standalone
    root.tsx            — layout raiz do TanStack Router
    modules/            — features (slices verticais)
      routes.ts         — árvore de rotas centralizada (Virtual File Routes)
      {feature}/
        pages/
        components/
        translations/
```

## Estilização (Tailwind v4 + tokens CSS — padrão híbrido)

Todos os tokens vivem em [`src/app/globals.css`](src/app/globals.css). **Nunca usar cores hardcoded** — sempre via tokens.

### Padrão unificado: CSS Modules + `@apply` em toda a aplicação

| Onde usar                                         | Padrão                              | Arquivo             |
| ------------------------------------------------- | ----------------------------------- | ------------------- |
| Primitivos UI e páginas (`components/`, `views/`) | **CSS Modules** + `@apply` + `clsx` | `styles.module.css` |
| Variantes (`cva`)                                 | Definido no `.tsx`, refs ao módulo  | — (topo do tsx)     |
| Wrapper simples (1-2 classes)                     | `cn()` inline no JSX                | —                   |
| Componente puro de lógica                         | nenhum                              | —                   |

**Nunca inline classes longas diretamente no JSX** — use sempre o arquivo de estilos.

---

### Padrão A: CSS Modules + `@apply` (componentes base)

```
components/ui/box/
  index.tsx          ← JSX / lógica
  box.module.css     ← estilos via @apply
```

**`Component.module.css` — estrutura:**

```css
.root {
    @apply rounded-(--radius-card) border border-(--color-border) bg-(--color-bg-card) p-4;

    & .header {
        @apply flex items-center gap-2 font-medium text-(--color-text-primary);
    }

    &:hover {
        @apply border-(--color-border-hover);
    }
}

.active {
    @apply border-(--color-primary) bg-(--color-primary-surface);
}
```

**Uso no JSX:**

```tsx
import {clsx} from 'clsx';
import styles from './Component.module.css';

// Estático
<div className={styles.root} />

// Condicional
<div className={clsx(styles.root, isActive && styles.active)} />

// Mix módulo + utilitário dinâmico de runtime
import {cn} from '@/lib/utils';
<div className={cn(styles.root, isExpanded ? 'col-span-2' : 'col-span-1')} />
```

> **`clsx` vs `cn`:**
>
> - `clsx` — combina classes de módulo (sem twMerge, não precisa)
> - `cn` (`clsx` + `tailwind-merge`) — quando mistura classes de módulo com utilitários Tailwind dinâmicos que podem conflitar

---

### Padrão B: CSS Modules para páginas (mesma estrutura do Padrão A)

```
views/modules/patients/pages/detail/
  index.tsx          ← JSX/lógica + cva() no topo referenciando o módulo
  styles.module.css  ← todas as classes via @apply
```

**`styles.module.css` com variantes `cva`:**

```css
/* styles.module.css */
@import 'tailwindcss';

.badgeBase {
    @apply inline-flex items-center rounded-(--radius-badge) px-2 py-0.5 text-xs;
}
.badgeSeverityHigh {
    @apply bg-(--color-danger)/10 text-(--color-danger);
}
.badgeSeverityMedium {
    @apply bg-(--color-warning)/10 text-(--color-warning);
}
.badgeSeverityLow {
    @apply bg-(--color-text-secondary)/10 text-(--color-text-secondary);
}
```

**`index.tsx` — cva no topo do arquivo:**

```tsx
import {cva} from 'class-variance-authority';
import styles from './styles.module.css';

const badge = cva(styles.badgeBase, {
    variants: {
        severity: {
            HIGH: styles.badgeSeverityHigh,
            MEDIUM: styles.badgeSeverityMedium,
            LOW: styles.badgeSeverityLow,
        },
    },
});

<span className={badge({severity: 'HIGH'})}>...</span>;
```

**Quando criar `styles.module.css`:**

| Condição                                    | Criar?                               |
| ------------------------------------------- | ------------------------------------ |
| Página (`views/modules/*/pages/`)           | **Sempre**                           |
| Componente com ≥ 5 classes em um elemento   | Sim                                  |
| Classes condicionais ou variantes (`cva`)   | Sim                                  |
| Componente puro de lógica (sem DOM visível) | Não — ex: `Can`, `ThemeProvider`     |
| Wrapper simples de 1-2 elementos            | Não                                  |
| `components/ui/*` (shadcn)                  | **Nunca** — não tocar esses arquivos |

---

### Box — primitivo polimórfico

```tsx
import {Box} from '@/components/ui/box';
import styles from './card.module.css';

// Renderiza <div> por padrão
<Box className={styles.root}>...</Box>

// Troca de elemento semântico
<Box as="section" className={styles.section}>...</Box>
<Box as="button" type="button" onClick={handleClick}>...</Box>
```

### Sintaxe canônica Tailwind v4

| Caso                                   | Sintaxe                             | Exemplo                                           |
| -------------------------------------- | ----------------------------------- | ------------------------------------------------- |
| Variável CSS de tema (cor, raio, etc.) | `utility-(--var-name)` (parênteses) | `bg-(--color-bg-card)`, `rounded-(--radius-card)` |
| Token de tipografia em `@theme`        | utility nomeada (sem var)           | `text-sm`, `text-2xl`, `text-sub`, `text-lead`    |
| Literal arbitrário (px, %, etc.)       | `utility-[valor]` (colchetes)       | `border-l-[3px]`, `leading-[1.2]`                 |

**Regra:** parênteses para variáveis CSS, colchetes apenas para valores literais. Nunca `utility-[var(--x)]` — use `utility-(--x)`.

### Regras absolutas (resumo de design-system.md §15)

1. **Zero cores hardcoded** — sempre tokens
2. **AI usa exclusivamente** `--color-ai-*` (teal); jamais reutilizar
3. **Cards sem sombra** — hierarquia por superfície (`bg-page → bg-surface → bg-card`)
4. **Pesos de fonte: só 400 e 500** (nunca 600/700/bold)
5. **Dados clínicos sempre `font-mono` + `tabular-nums`**
6. **AIBlock tem `border-radius: 0`** (regra absoluta)
7. **Dark mode via classe `.dark`** controlada por Zustand (`colorMode`)
8. **Background dark é `#020617`**, nunca `#000000`
9. **`--color-danger` apenas para alertas clínicos reais**; validação de form usa warning
10. **Frontend nunca seleciona agente IA** — backend resolve

## Componentes UI

```tsx
// Primitivos shadcn (em src/components/ui/)
import {Button} from '@/components/ui/button';
import {Card, CardHeader, CardContent} from '@/components/ui/card';
import {Dialog, DialogContent} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';

// Compartilhados de app (em src/views/components/)
import {Page} from '@/views/components/Page';
import {FormActions} from '@/views/components/FormActions';
import {Can} from '@/views/components/Can';

// Clínicos customizados (em src/components/clinical/)
import {AIBlock} from '@/components/clinical/ai-block';
import {ConfidenceIndicator} from '@/components/clinical/confidence-indicator';
```

Adicionar novo componente shadcn:

```bash
cd apps/web
npx shadcn@latest add <component>
```

## Roteamento (TanStack Router v1)

- Rotas definidas em [`src/views/modules/routes.ts`](src/views/modules/routes.ts) via **Virtual File Routes**
- Vite plugin regenera `routeTree.gen.ts` automaticamente (não editar)
- Route loaders pré-carregam queries antes da montagem do componente:

```typescript
export const Route = createFileRoute('/_stackedLayout/appointments')({
    loader: ({context: {queryClient}}) => queryClient.ensureQueryData(getListAppointmentsSuspenseQueryOptions()),
    pendingComponent: LoadingPage,
    component: AppointmentsPage,
});
```

- Guards de rota verificam autenticação no `beforeLoad` (já configurado em `_auth` e `_stackedLayout`)
- Detalhes em [`docs/frontend/02-routing.md`](../../docs/frontend/02-routing.md)

## Client API (Orval — nunca escreva chamadas à mão)

O client é gerado automaticamente de `openapi.json`:

```typescript
import {useGetAppointments, useCreateAppointment} from '@agenda-app/client';

const {data, isLoading} = useGetAppointments({page: 1, limit: 20});
const mutation = useCreateAppointment();
mutation.mutate({data: payload});
```

Para regenerar após mudança na API:

```bash
pnpm -F @agenda-app/server openapi:generate   # atualiza openapi.json
pnpm -F @agenda-app/client generate           # regenera hooks
```

## State management

- **Server state** → React Query (via hooks Orval)
- **UI state** → Zustand ([`src/store/appStore.ts`](src/store/appStore.ts)), persistido em localStorage

```typescript
const {colorMode, setColorMode} = useAppStore();
```

## Formulários (React Hook Form + Zod)

```typescript
const schema = z.object({name: z.string().min(1), date: z.string()});
type FormData = z.infer<typeof schema>;

const {
    register,
    handleSubmit,
    formState: {errors},
} = useForm<FormData>({
    resolver: zodResolver(schema),
});
```

- Formulários complexos expõem `{ submit }` via `useImperativeHandle` — a **página pai** controla o envio, não o form
- Nunca acople navegação dentro do componente de form
- Erros de validação usam `--color-warning`, **não** `--color-danger`

## Internacionalização (i18next)

- 3 locales: `pt-BR` (padrão), `en-US`, `es-ES`
- Traduções em [`src/translations/{locale}/common.json`](src/translations/)
- `useTranslation()` para acessar strings

## Permissões (server-driven)

```typescript
import {useCan} from '@/hooks/useCan';
import {Can} from '@/views/components/Can';

// Hook
const allowed = useCan({has: 'appointment:create'});

// Componente
<Can has="appointment:delete" granted={<DeleteButton />} />
```

> **Nota:** o hook `useCan` está como placeholder retornando sempre `true` até o backend expor `useGetUserPermissions` via Orval. Veja [`docs/frontend/03-auth.md`](../../docs/frontend/03-auth.md) para a API alvo.

## Convenções importantes

- `routeTree.gen.ts` é gerado — nunca edite manualmente
- Nunca escreva chamadas Axios/fetch à mão — use os hooks Orval de `@agenda-app/client`
- Formulários não navegam por conta própria — página pai controla submit + navigate
- Permissões sempre checadas via `useCan()`/`<Can>`, nunca hard-coded
- Conteúdo gerado por IA **sempre** dentro de `<AIBlock>`; nunca usar accent teal fora desse componente
- Dados clínicos numéricos (PA, FC, dosagem, IDs) sempre em `font-mono tabular-nums`

## Documentação de referência

- [`docs/frontend/design-system.md`](../../docs/frontend/design-system.md) — **fonte canônica** de tokens, cores, tipografia, padrões clínicos
- [`docs/frontend/01-architecture.md`](../../docs/frontend/01-architecture.md) — stack, estrutura, providers
- [`docs/frontend/02-routing.md`](../../docs/frontend/02-routing.md) — TanStack Router, virtual routes, guards
- [`docs/frontend/03-auth.md`](../../docs/frontend/03-auth.md) — auth flow, permissões, useCan
- [`docs/frontend/04-state-management.md`](../../docs/frontend/04-state-management.md) — React Query + Zustand
- [`docs/frontend/05-api-integration.md`](../../docs/frontend/05-api-integration.md) — Orval, client gerado
- [`docs/frontend/06-component-patterns.md`](../../docs/frontend/06-component-patterns.md) — Page, FormActions, Can, layouts
- [`docs/frontend/07-styling.md`](../../docs/frontend/07-styling.md) — Tailwind v4, tokens, dark mode
- [`docs/frontend/08-forms.md`](../../docs/frontend/08-forms.md) — React Hook Form + Zod
- [`docs/frontend/09-i18n.md`](../../docs/frontend/09-i18n.md) — i18next
- [`docs/frontend/10-packages.md`](../../docs/frontend/10-packages.md) — workspace packages
