---
name: create-react-feature
description: Use when implementing or changing apps/web routes, pages, components, hooks, forms, translations, or generated-client consumers.
---

# Create React Feature

Use the existing feature-module style in `apps/web/src/views/modules`.

## Workflow

1. Read `apps/web/CLAUDE.md` and `docs/frontend/06-component-patterns.md`, and inspect nearby feature modules.
2. Inspect similar pages/components/hooks before creating a new pattern.
3. Use generated `@agenda-app/client` models and hooks as the API contract — never hand-write Axios/fetch calls (the one authorized exception is `packages/client/src/api-client.ts`).
4. Use shadcn/ui primitives (`src/components/ui/`) before custom UI; clinical-domain components live in `src/components/clinical/`.
5. Keep page files for route composition and workflow orchestration.
6. Extract reusable behavior to hooks (`src/hooks/`) or helpers.
7. Use React Hook Form + `zodResolver` for forms (see `docs/frontend/08-forms.md`); the parent page controls submit/navigate, never the form component itself.
8. Update `pt-BR`, `en-US`, and `es-ES` translations in `src/translations/*/common.json`.
9. Gate any permission-sensitive UI with `useCan()`/`<Can>`, never a hardcoded check.

## UI Rules

- Follow the CSS Modules + `@apply` + `clsx` pattern in `apps/web/CLAUDE.md` §Estilização for anything with ≥5 classes or variants; use `cn()` inline only for a 1–2 class wrapper.
- Zero hardcoded colors — always through the CSS tokens in `src/app/globals.css`.
- Include loading, error, empty, and success states where the workflow needs them.
- Do not restore removed backend fields in the UI; adapt to the generated client.
- AI-generated content always renders inside `<AIBlock>`; never reuse the AI teal accent outside it.
- Clinical numeric data (vitals, dosage, IDs) renders `font-mono tabular-nums`.

## Tests

`apps/web` has no unit-test runner configured yet — Vitest here only drives Storybook interaction/visual tests (`*.stories.tsx` via `@storybook/addon-vitest`), not `*.test.tsx` component unit tests. For now, validate UI behavior manually or through Playwright e2e (`write-playwright-e2e` skill) rather than assuming a Jest/Testing-Library setup exists.

## Validation

```bash
pnpm -F @agenda-app/app typecheck
pnpm -F @agenda-app/app code-check
```
