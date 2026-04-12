# Component Patterns

## Component Categories

### 1. Shared Components (`src/views/components/`)

Reusable components used across multiple modules:

| Component | Purpose |
|-----------|---------|
| `Can` | Permission guard — renders children based on user permissions |
| `Page` | Full page wrapper with header, scroll area, optional footer |
| `PageHeader` | Page title + breadcrumbs + action slot |
| `FormActions` | Standard form submit/cancel buttons with permission gate |
| `AppLoader` | App-wide loading spinner |
| `QueryErrorHandler` | Global React Query error display |
| `DeleteItemModal` | Confirmation modal for delete actions with built-in permission check |
| `Breadcrumbs` | Navigation breadcrumbs from router context |
| `Filter` | Generic filter panel UI |
| `Skeletons/TableSkeleton` | Loading skeleton for list pages |
| `Skeletons/FormSkeleton` | Loading skeleton for form pages |
| `Icons/` | Custom SVG icon components specific to the app |

### 2. Layout Components (`src/views/layouts/`)

| Layout | Route key | Usage |
|--------|-----------|-------|
| `AuthLayout` | `_auth` | Wraps unauthenticated pages (sign-in) |
| `StackedLayout` | `_stackedLayout` | Main app shell with sidebar, all authenticated pages |

### 3. Module Components (`src/views/modules/{module}/components/`)

Feature-specific components scoped to a single module. They are never imported by other modules.

### 4. Mantine Components

All primitive UI elements (buttons, inputs, tables, etc.) come from the **Mantine** library. Never build raw HTML equivalents for things the library already provides.

---

## Naming Conventions

| Entity | Convention | Example |
|--------|-----------|---------|
| Component directory | PascalCase + `index.tsx` | `ItemForm/index.tsx` |
| Hook files | camelCase + `use` prefix | `useCan.ts`, `useFileUpload.ts` |
| Style files | `styles.ts` (co-located) | `ItemForm/styles.ts` |
| Translation key files | `translations.ts` (co-located) | `ItemForm/translations.ts` |
| Route definitions | `pages/routes.ts` per module | `feature/pages/routes.ts` |
| Type exports | PascalCase + descriptive suffix | `ItemFormFields`, `ItemFormRef` |

---

## Page Component Pattern

Every page follows this structure:

```tsx
// 1. Route definition
export const Route = createFileRoute('/_stackedLayout/items/new')({
  beforeLoad: (): BreadcrumbContext => ({breadcrumb: 'items.new'}),
  pendingComponent: LoadingPage,
  component: NewItemPage,
});

// 2. Main page component
export function NewItemPage() {
  const {t} = useTranslation(translationKey);
  // ... hooks and handlers

  return (
    <Page
      title={t('title')}
      actions={
        <FormActions
          isDirty={isDirty}
          onSubmit={handleSubmit}
          submitPermission="entity:create"
        />
      }
      responsiveActions  // stacks actions below title on small screens
    >
      {/* page content */}
    </Page>
  );
}

// 3. Skeleton shown while the route loader runs
export function LoadingPage() {
  const {t} = useTranslation(translationKey);
  return (
    <Page title={t('title')} actions={<FormActions />} responsiveActions>
      <FormSkeleton />
    </Page>
  );
}
```

---

## Form Component Pattern (Ref-Controlled)

Complex forms are extracted into separate components that expose a `submit()` method via `useImperativeHandle`. The parent page controls when to submit (e.g., a header button) without coupling itself to the form's internals.

```tsx
// 1. Define the ref handle type
export type ItemFormRef = {
  submit: () => void;
};

// 2. Implement with forwardRef
export const ItemForm = forwardRef<ItemFormRef, ItemFormProps>(
  ({initialData, onSubmit, onDirtyChange}, ref) => {
    const {handleSubmit, formState: {isDirty}} = useValidatedForm({...});

    // Notify parent when dirty state changes
    useEffect(() => {
      onDirtyChange?.(isDirty);
    }, [isDirty, onDirtyChange]);

    const submitForm = handleSubmit((values) => onSubmit(sanitize(values)));

    // Expose submit to parent via ref
    useImperativeHandle(ref, () => ({submit: submitForm}));

    return (
      <Form onSubmit={submitForm}>
        {/* form fields */}
      </Form>
    );
  }
);

// 3. Parent page usage
const formRef = useRef<ItemFormRef>(null);
const [isDirty, setIsDirty] = useState(false);

const handleSubmit = () => formRef.current?.submit();

<Page actions={<FormActions isDirty={isDirty} onSubmit={handleSubmit} />}>
  <ItemForm
    ref={formRef}
    onDirtyChange={setIsDirty}
    onSubmit={(values) => createItem({data: values})}
  />
</Page>
```

---

## List Page Pattern (CRUD)

```tsx
export function ListPage() {
  const search = Route.useSearch();          // typed URL search params
  const navigate = Route.useNavigate();
  const [loading, startTransition] = useTransition();
  const queryClient = useQueryClient();

  // Data from cache (preloaded by route loader)
  const {data: list} = useListItemsSuspense(queryArgs);

  // Mutation with cache invalidation
  const {mutateAsync: deleteItem} = useDeleteItem({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({queryKey: getListItemsQueryKey()});
      },
    },
  });

  // Filter → update URL (not component state)
  const applyFilter = (filters: Filters) => {
    startTransition(async () => {
      await navigate({search: () => ({...filters, page: 1})});
    });
  };

  return (
    <Page title={t('title')} actions={headerActions}>
      <Table
        data={list.data}
        loading={loading}
        columns={[...]}
        pagination={{
          mode: 'pages',
          currentPage: search.page,
          pageSize: search.limit,
          itemCount: list.totalCount,
          onPageChange: (page) =>
            startTransition(async () => {
              await navigate({search: (prev) => ({...prev, page})});
            }),
        }}
      />
    </Page>
  );
}
```

---

## `StackedLayout` (Main App Shell)

The authenticated shell contains:
1. **Sidebar** — collapsible, permission-filtered navigation with grouped items
2. **`<Outlet />`** — where child routes render

Key features:
- Current user avatar links to `/user-profile`
- Company/tenant switcher in sidebar footer
- Theme toggle (light/dark) in sidebar footer
- Logout button
- Hidden devtools toggle (e.g., double-click on logo)

```tsx
<Sidebar
  logo={<AppIcon />}
  expandedLogo={<AppNameIcon />}
  infoSection={infoSection}            // user info + company switcher
  footerItems={filteredFooterItems}
  items={[
    ...dashboardItems,
    ...operationalGroup,
    ...administrativeGroup,
    ...masterDataGroup,
  ]}
>
  <Outlet />
</Sidebar>
```

Navigation items are defined as typed objects and filtered at render time based on user permissions (see [auth.md](./03-auth.md#sidebar-navigation-filtering)).

---

## `Can` Component Usage

```tsx
// Render prop — receives the boolean to decide rendering
<Can has="entity:create">
  {(allowed) => (
    <Button disabled={!allowed} disabledHint={{title: t('permission.denied')}}>
      Add
    </Button>
  )}
</Can>

// Conditional render
<Can has="entity:delete" granted={<DeleteButton />} />

// Multiple permissions
<Can hasAny={['entity:create', 'entity:update']}>
  {(allowed) => allowed ? <EditActions /> : null}
</Can>
```
