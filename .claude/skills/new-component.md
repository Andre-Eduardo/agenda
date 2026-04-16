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
   - Component name
   - Target module (e.g., `room`, `person`, `room-dashboard`)
   - Type: `page` (goes in `pages/`) or `component` (goes in `components/`)

2. Create the component folder with all required files:

### `index.tsx`
```tsx
import {useTranslation} from '@ecxus/ui/hooks/useTranslation'

import {style} from './styles'
import {translationKey} from './translations'

export default function ComponentName() {
  const {t} = useTranslation(translationKey)

  return (
    // Component JSX
  )
}
```

### `styles.ts`
```ts
import type {BoxStyleObject} from '@ecxus/ui/components/Box'

export const style = {
  container: {},
} satisfies Record<string, BoxStyleObject>
```

### `translations.ts`
```ts
export const translationKey = 'module.moduleName.componentName'
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

3. If it's a page, remind the user to add a route entry in the module's `routes.ts`.

4. Remind the user to add translation keys in `src/translations/{locale}/module/{moduleName}/`.
