# Web — @agenda-app/app

React 19 + TypeScript 6 + Vite 6 (SWC). Sem Tailwind.

## Estrutura de pastas

```
src/
  main.tsx              — entry point
  App.tsx               — providers raiz
  routeTree.gen.ts      — GERADO automaticamente pelo TanStack Router (não editar)
  hooks/                — hooks globais (useCan, useFileUpload…)
  store/                — Zustand stores (appStore, devtoolsStore)
  styles/               — tokens de tema (lightMode.ts, darkMode.ts)
  translations/         — configuração i18next
  utils/                — helpers globais
  views/
    components/         — componentes reutilizáveis globais
    layouts/            — AuthLayout, StackedLayout
    root.tsx            — layout raiz do TanStack Router
    modules/            — features (slices verticais)
      routes.ts         — árvore de rotas centralizada (Virtual File Routes)
      auth/             — módulo de autenticação
      {feature}/        — um diretório por feature
        pages/
        components/
        translations/
```

## Roteamento (TanStack Router v1)

- Rotas definidas em `src/views/modules/routes.ts` via **Virtual File Routes**
- O Vite plugin regenera `routeTree.gen.ts` automaticamente (não editar)
- Route loaders pré-carregam queries antes da montagem do componente:

```typescript
export const Route = createFileRoute('/appointments')({
    loader: ({context: {queryClient}}) =>
        queryClient.ensureQueryData(appointmentsQueryOptions()),
    component: AppointmentsPage,
});
```

- Guards de rota verificam autenticação/permissões no loader

## Client API (Orval — nunca escreva chamadas à mão)

O client é gerado automaticamente de `openapi.json`:

```typescript
// uso — hook gerado por Orval
const {data, isLoading} = useGetAppointments({companyId, page: 1, limit: 20});
const mutation = useCreateAppointment();
mutation.mutate({companyId, ...payload});
```

Para regenerar após mudança na API:
```bash
pnpm -F @agenda-app/server openapi:generate   # atualiza openapi.json
pnpm -F @agenda-app/client generate           # regenera hooks
```

## State management

- **Server state** → React Query (via hooks Orval)
- **UI state** → Zustand (`src/store/`), persistido no localStorage

```typescript
// Zustand
const {sidebarOpen, setSidebarOpen} = useAppStore();
```

## Formulários (React Hook Form + Zod)

```typescript
const schema = z.object({name: z.string().min(1), date: z.string()});
type FormData = z.infer<typeof schema>;

const {register, handleSubmit, formState: {errors}} = useForm<FormData>({
    resolver: zodResolver(schema),
});
```

- Formulários complexos expõem `{ submit }` via `useImperativeHandle` — a **página pai** controla o envio, não o form
- Nunca acople navegação dentro do componente de form

## Estilização (BoxStyle — sem Tailwind)

```typescript
// styles.ts (co-localizado com o componente)
export const cardStyle: BoxStyle = {
    backgroundColor: 'var(--color-surface)',
    padding: 'var(--spacing-md)',
    borderRadius: 'var(--radius-md)',
};

// uso
<Box style={cardStyle}>...</Box>
```

- Tokens de tema: `var(--color-*)`, `var(--spacing-*)`, `var(--radius-*)`
- Modo claro/escuro via provider de tema
- Estilos co-localizados em `styles.ts` ao lado do componente

## Internacionalização (i18next)

- 3 locales: `pt-BR` (padrão), `en-US`, `es-ES`
- Traduções por módulo em `{feature}/translations/{locale}.json`
- `useTranslation()` para acessar strings

## Permissões (server-driven)

```typescript
const {can} = useCan();
if (!can('appointment:create')) return null;
```

Permissões são strings `"entity:action"` buscadas em `/api/v1/auth/permissions`. Sidebar e botões de ação dependem dessa checagem.

## Componentes

- Nomenclatura: PascalCase, co-localizado com a feature
- Componentes globais em `views/components/`
- Layout de página: use `StackedLayout` (autenticado) ou `AuthLayout` (login)
- Import de componentes UI: `@ecxus/ui` (Mantine 7 internamente)

## Convenções importantes

- `routeTree.gen.ts` é gerado — nunca edite manualmente
- Nunca escreva chamadas Axios/fetch à mão — use os hooks Orval
- Formulários não navegam por conta própria — página pai controla submit + navigate
- Permissões sempre checadas via `useCan()`, nunca hard-coded
