# Styling

## Approach

The app uses **shadcn/ui** (Tailwind CSS v4 + Radix UI primitives) as the component and styling system. Styles are written as **Tailwind utility classes** applied directly in JSX. CSS custom properties defined in `src/app/globals.css` serve as the design token layer.

There is **no CSS-in-JS**, no co-located `styles.ts` files, and no Mantine/Emotion.

---

## Token System (CSS Variables)

All design tokens are defined in `src/app/globals.css` under `@theme` (Tailwind v4 theme block) and `@layer base` (`:root` / `.dark`). Always reference tokens via CSS variables — never use hardcoded hex values.

### Token namespaces

| Namespace | Examples | Usage |
|-----------|---------|-------|
| `--color-bg-*` | `--color-bg-page`, `--color-bg-card` | Surface backgrounds |
| `--color-text-*` | `--color-text-primary`, `--color-text-secondary` | Text colors |
| `--color-border*` | `--color-border`, `--color-border-hover` | Border colors |
| `--color-primary*` | `--color-primary`, `--color-primary-hover` | Primary action color |
| `--color-ai-*` | `--color-ai-bg`, `--color-ai-border` | AI content — exclusive to AI blocks |
| `--color-*` semantic | `--color-success`, `--color-warning`, `--color-danger` | Status/semantic colors |
| `--color-confidence-*` | `--color-confidence-high`, `--color-confidence-mid` | AI field confidence indicators |
| `--radius-*` | `--radius-card`, `--radius-button`, `--radius-badge` | Border radii |
| `--shadow-*` | `--shadow-focus`, `--shadow-dropdown` | Shadows |
| `--duration-*` | `--duration-fast`, `--duration-base`, `--duration-slow` | Animation durations |
| `--padding-*` | `--padding-card`, `--padding-section` | Spacing (density modes) |
| `--font-sans` / `--font-mono` | Inter / JetBrains Mono | Typefaces |

See [`design-system.md`](./design-system.md) for the full token specification and `globals.css` implementation.

---

## Using Tokens in Components

### Tailwind arbitrary value syntax (preferred)

```tsx
// Surface backgrounds
<div className="bg-[var(--color-bg-card)] rounded-[var(--radius-card)]">

// Text
<span className="text-[var(--color-text-secondary)] text-sm">

// Border
<div className="border border-[var(--color-border)] hover:border-[var(--color-border-hover)]">

// Primary button
<button className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]">
```

### `cn()` utility for conditional classes

```tsx
import {cn} from '@/lib/utils';

<div className={cn(
  'rounded-[var(--radius-card)] border border-[var(--color-border)]',
  isSelected && 'border-2 border-[var(--color-primary)]',
  isAI && 'bg-[var(--color-ai-bg)] border-l-4 border-l-[var(--color-ai-border)] rounded-none',
)}>
```

### Inline styles for CSS variables that aren't Tailwind utilities

```tsx
<div style={{
  padding: 'var(--padding-card)',
  gap: 'var(--gap-elements)',
}}>
```

---

## shadcn/ui Components

Components from shadcn/ui live directly in the repository under `src/components/ui/`. They are owned code — customizable without npm upgrade cycles.

Customize component defaults by editing the component file in `src/components/ui/`. Do not create extra wrapper components just to override styles.

```tsx
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {Card, CardHeader, CardContent} from '@/components/ui/card';
import {Dialog, DialogContent, DialogHeader} from '@/components/ui/dialog';
import {Select, SelectTrigger, SelectContent, SelectItem} from '@/components/ui/select';
```

---

## Surface Hierarchy

Cards and panels establish hierarchy through surface color contrast — not box-shadow.

```
Page         bg: --color-bg-page     (slate-50)
  └── Panel  bg: --color-bg-surface  (slate-100)
        └── Card  bg: --color-bg-card   border: 0.5px solid --color-border
              └── Inline block  bg: --color-bg-surface  rounded-[var(--radius-data)]
```

Three levels of border emphasis:

```css
/* Resting */
border: 0.5px solid var(--color-border);

/* Hover / emphasis */
border: 0.5px solid var(--color-border-hover);

/* Selected / active */
border: 2px solid var(--color-primary);

/* AI accent — always border-left, never rounded */
border-left: 3px solid var(--color-ai-border);
border-radius: 0;
```

---

## Light/Dark Mode

Dark mode is controlled by the `dark` class on `<html>`. The `ThemeProvider` in `App.tsx` reads `colorMode` from Zustand and sets/removes the class:

```tsx
useEffect(() => {
  document.documentElement.classList.toggle('dark', colorMode === 'dark');
}, [colorMode]);
```

**Never** use `prefers-color-scheme` directly inside components. All dark-mode token overrides are defined in `globals.css` under `.dark { ... }`. The background in dark mode resolves to `#020617` — never `#000000`.

---

## Typography

| Font | Tailwind class | Use |
|------|---------------|-----|
| Inter | `font-sans` | All UI text — labels, buttons, body, forms |
| JetBrains Mono | `font-mono` | Clinical data — PA, FC, SpO₂, dosages, IDs, timestamps |

Font weights: **400 (regular)** and **500 (medium)** only. Never 600, 700, or `font-bold`.

Clinical numeric data must use tabular-nums for column alignment:
```tsx
<span className="font-mono tabular-nums text-sm">140/90 mmHg</span>
```

---

## Shadow & Elevation

```tsx
// Cards / panels: no shadow
<Card className="shadow-none">

// Dropdowns, popovers: shadow via token
<div style={{boxShadow: 'var(--shadow-dropdown)'}}>

// Focus ring: defined in globals.css, used by shadcn components automatically
// --shadow-focus: 0 0 0 2px #2563EB
```

---

## Motion

All transitions use `ease-out` and the three duration tokens:

```css
/* Hover, active states */
transition: all var(--duration-fast) var(--ease);

/* Toggle, open/close */
transition: all var(--duration-base) var(--ease);

/* Modals, route transitions */
transition: all var(--duration-slow) var(--ease);
```

---

## Semantic Color Rules

| Token | Correct use | Wrong use |
|-------|------------|-----------|
| `--color-danger` | Clinical alerts: allergies, drug interactions, critical values | Form validation errors |
| `--color-warning` | Form validation errors, low-confidence AI fields | General "bad" states |
| `--color-ai-*` | AI-generated content exclusively | Any other teal accent |
| `--color-primary` | Primary actions, active nav, links | AI-related content |
