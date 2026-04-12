# Styling

## Approach

The app uses **Mantine v8** for UI components. Styles are written as **standard React CSS objects** in co-located `styles.ts` files and applied via the `style` prop on Mantine components (like `Box`, `Flex`, `Button`).

There is **no Tailwind CSS**, no CSS Modules (unless strictly necessary for global styles), and no legacy CSS-in-JS libraries like Emotion or styled-components.

---

## Style Objects (co-located `styles.ts`)

Each component and page has a co-located `styles.ts` file that exports typed style objects. Styles are never inlined in the JSX file.

**File structure:**
```
ItemForm/
├── index.tsx          ← imports style from styles.ts
├── styles.ts          ← exports style objects
└── translations.ts
```

**`styles.ts` example:**
```ts
import { CSSProperties } from 'react';

export const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--mantine-spacing-md)',
};

export const actionsStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 'var(--mantine-spacing-xs)',
};
```

**`index.tsx` usage:**
```tsx
import { Box } from '@mantine/core';
import { containerStyle, actionsStyle } from './styles';

function ItemForm() {
  return (
    <Box style={containerStyle}>
      ...
      <Box style={actionsStyle}>...</Box>
    </Box>
  );
}
```

---

## Token System (CSS Variables)

Colors and spacing are managed via **Mantine CSS Variables**. This ensures that light/dark mode transitions are handled automatically by the browser without re-renders.

### Mantine Variable Convention

Mantine exposes variables for colors, spacing, radius, and shadows:

| Type | Variable Pattern | Example |
|------|------------------|---------|
| Colors | `var(--mantine-color-{name}-{index})` | `var(--mantine-color-blue-6)` |
| Spacing | `var(--mantine-spacing-{size})` | `var(--mantine-spacing-xl)` |
| Radius | `var(--mantine-radius-{size})` | `var(--mantine-radius-md)` |
| Fonts | `var(--mantine-font-family)` | `var(--mantine-font-family-monospace)` |

### App-Specific Tokens

For application-specific tokens not covered by Mantine's defaults, we define custom CSS variables in the global theme.

**Examples:**
```ts
'var(--app-card-bg)'
'var(--app-sidebar-width)'
'var(--app-header-height)'
```

---

## Theme Definition

The app theme is defined in `src/styles/theme.ts` using `createTheme`.

```ts
// src/styles/theme.ts
import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'brand',
  colors: {
    brand: ['#eef3ff', ...], // 10 color shades
  },
  // Custom configurations
});
```

---

## Light/Dark Mode Switching

Mantine handles light/dark mode via the `defaultColorScheme` and `forceColorScheme` props on `MantineProvider`. The current mode is managed by Mantine's internal state or synced with Zustand if needed.

The provider is configured in `App.tsx`:
```tsx
<MantineProvider theme={theme} defaultColorScheme="light">
  ...
</MantineProvider>
```

---

## Responsive Styles

While the `style` prop is static, you can use Mantine's `styles` API or class names for complex responsive logic, but for simple layouts, prefer Mantine's responsive props on components like `Grid`, `SimpleGrid`, or `Group`:

```tsx
<Group gap={{ base: 'sm', sm: 'lg' }}>
  ...
</Group>
```

Or use media queries within standard CSS if `style` objects are insufficient.
