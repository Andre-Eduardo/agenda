---
name: new-component
description: Scaffold a new React component following project conventions
user_invocable: true
---

# Create New Component

Scaffold a new React component with all co-located files following project conventions.

## Arguments

The user should provide:
- Component name (PascalCase)
- Location (module and whether it's a page or shared component)

## Steps

1. Ask the user (if not provided):
   - Component name (PascalCase)
   - Target module (e.g., `patients`, `dashboard`, `settings`)
   - Type: `page` (goes in `pages/`) or `component` (goes in `components/`)

2. Create the component folder under `apps/web/src/views/modules/{module}/pages/{name}/` (page) or `apps/web/src/views/modules/{module}/components/{name}/` (component) with os seguintes arquivos:

### `index.tsx`
```tsx
import {useTranslation} from 'react-i18next'

export default function ComponentName() {
  const {t} = useTranslation('common')

  return (
    <div className="...">
      {/* Component JSX */}
    </div>
  )
}
```

### `styles.ts` (opcional — apenas se houver classes Tailwind reutilizadas)
```ts
export const styles = {
  container: 'flex flex-col gap-4',
} as const
```

### `index.test.tsx`
```tsx
import {render, screen} from '@testing-library/react'

import ComponentName from '.'

describe('ComponentName', () => {
  it('should render', () => {
    render(<ComponentName />)
    // Add assertions
  })
})
```

3. Se for uma **página**, lembrar o usuário de:
   - Adicionar a rota no `apps/web/src/views/modules/routes.ts` e no `routeTree.gen.ts`
   - Seguir o padrão TanStack Router (ver `docs/frontend/routing.md`)

4. Lembrar o usuário de adicionar as chaves de tradução nos 3 arquivos JSON:
   - `apps/web/src/translations/pt-BR/common.json`
   - `apps/web/src/translations/en-US/common.json`
   - `apps/web/src/translations/es-ES/common.json`

5. Usar componentes de `shadcn/ui` (já instalados em `apps/web/src/components/ui/`) sempre que possível — não crie primitivos do zero.
