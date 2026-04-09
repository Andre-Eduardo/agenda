# Styling

## Approach

The app uses a **CSS-in-JS** system provided by the UI library. Styles are written as **typed JavaScript objects** (not CSS strings or class names) and applied via a `style` prop on a layout component from the library.

There is **no Tailwind CSS**, no CSS Modules, and no styled-components.

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
import type {BoxStyle} from '@ui-lib/components/Box';

export const containerStyle: BoxStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

export const actionsStyle: BoxStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 2,
};
```

**`index.tsx` usage:**
```tsx
import {containerStyle, actionsStyle} from './styles';

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

## Token System (Key-Based Colors)

Colors are **never hardcoded** (no hex values, no `rgb()` literals in component files). Instead, they reference **string token paths** that resolve to theme values at runtime. This is what makes light/dark mode work automatically.

### Token Path Convention

Token paths follow a hierarchical dot-notation that mirrors the UI structure:

```
{scope}.{area}.{component-or-module}.{element}.{property}
```

**Scopes:**

| Scope | Used for |
|-------|---------|
| `app.components.{name}.*` | Shared cross-module components |
| `app.module.{module}.components.{name}.*` | Feature-specific components |
| `app.module.{module}.page.{page}.*` | Feature-specific pages |
| `app.layout.{layout}.*` | Layout shells (sidebar, etc.) |
| `app.page.{name}.*` | Standalone pages (error, not-found) |

**Examples:**
```ts
'app.components.actionCard.backgroundHover'
'app.components.filter.title'
'app.module.featureA.components.stateCard.active.background'
'app.module.featureA.page.detailsPage.labelColor'
'app.layout.stackedLayout.border'
'app.page.notFound.title.text'
```

Base palette tokens from the UI library are also available:
```ts
'brand.850'
'accent.base'
'accent.muted'
'gray.dark.500'
'danger.500'
'warning.300'
'info.200'
'white'
'transparent'
```

---

## Theme Definition Files

The app defines two theme files, each exporting a complete token tree:

```
src/styles/
├── lightMode.ts     ← light color values
└── darkMode.ts      ← dark color values
```

Both files extend the base theme from the UI library and add app-specific tokens:

```ts
// src/styles/lightMode.ts
import {lightMode as baseMode} from '@ui-lib/styles/theme/colors/light';

export const lightMode = {
  ...baseMode,       // inherit all UI library tokens
  app: {
    components: {
      filter: {
        background: gray.dark[50],
        title: brand['700'],
      },
    },
    module: {
      featureA: {
        components: {
          stateCard: {
            active:   {background: green['200'], border: green['500'], text: green['700']},
            inactive: {background: gray['200'],  border: gray['500'],  text: gray['700']},
          },
        },
      },
    },
    layout: {
      stackedLayout: {
        border: gray.dark['200'],
      },
    },
    page: {
      notFound: {
        title: {text: accent.base},
      },
    },
  },
};
```

`darkMode.ts` mirrors the exact same structure with dark-appropriate values.

---

## Adding a New Token

1. Add the token to both `lightMode.ts` and `darkMode.ts` under the correct scope
2. Reference it by path string in `styles.ts`:
   ```ts
   color: 'app.module.myFeature.components.myCard.title'
   ```

Never add a token to only one mode — both must always be in sync.

---

## Light/Dark Mode Switching

The current mode is stored in Zustand (`appStore.colorMode`) and persisted to localStorage. Initial value comes from `window.matchMedia('(prefers-color-scheme: dark)')`.

The theme provider is configured in `App.tsx`:
```tsx
<ThemeProvider
  colorModes={{light: lightMode, dark: darkMode}}
  defaultMode={colorMode}
  onColorModeChange={setColorMode}
>
```

Switching the mode at runtime:
```tsx
const {setColorMode} = useTheme(); // hook from the UI library

setColorMode('dark');
```

---

## Nested Selectors and Pseudo-selectors

Style objects support nested CSS selectors using `&`:

```ts
const style: BoxStyle = {
  display: 'flex',

  // Target a child with a class
  '& > .icon': {
    color: 'accent.base',
    transition: 'color 0.2s',
  },

  // Hover state
  '&:hover': {
    backgroundColor: 'app.components.card.backgroundHover',
  },

  // Pseudo-elements
  '&::before': {
    content: '""',
    display: 'block',
  },
};
```

---

## Keyframe Animations

Define keyframes inline inside the style object:

```ts
const style: BoxStyle = {
  '@keyframes fadeIn': {
    '0%':   {opacity: 0, transform: 'translateY(-8px)'},
    '100%': {opacity: 1, transform: 'translateY(0)'},
  },
  animation: 'fadeIn 0.3s ease-out',
};
```

---

## Spacing Scale

Numeric spacing values map to a base scale (typically 4px per unit):

```
gap: 1  →  4px
gap: 2  →  8px
gap: 4  →  16px
gap: 8  →  32px
padding: 4  →  16px
```

Use numeric values from the scale — do not write `'16px'` directly unless unavoidable.

---

## Responsive Styles

The style object supports breakpoint keys:

```ts
const style: BoxStyle = {
  flexDirection: 'column',   // default (mobile-first)

  '@sm': {
    flexDirection: 'row',    // at 'sm' breakpoint and above
  },
};
```

Breakpoints match the UI library's breakpoint scale (`sm`, `md`, `lg`, `xl`).

---

## Summary: What to Put in `styles.ts` vs. Inline

| ✅ In `styles.ts` | ❌ Not in component JSX |
|-------------------|------------------------|
| Layout and spacing | Hardcoded hex colors |
| Token-based colors | Arbitrary pixel values |
| Animations | Style logic mixed with render logic |
| Nested selectors | Copy-pasted styles across files |
| Responsive variants | |
