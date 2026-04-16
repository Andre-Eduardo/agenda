---
name: translate
description: Add or update translation keys across all 3 languages (pt-BR, en-US, es-ES) for a component
user_invocable: true
---

# Add/Update Translations

Add or update i18n translation keys for a component across all 3 supported languages.

## Arguments

The user should provide:
- The component or page name/path
- The new translation keys and their Portuguese (pt-BR) values
- Optionally, English and Spanish values (otherwise generate them)

## Translation System Overview

Each component has a `translations.ts` file that exports:
- `translationKey` — the i18n namespace (e.g., `'app:module.room.page.roomsPage'`)
- A TypeScript type defining the translation shape

The actual translated values live in 3 directories:
- `apps/web/src/translations/pt-BR/` — Portuguese (Brazil)
- `apps/web/src/translations/en-US/` — English (US)
- `apps/web/src/translations/es-ES/` — Spanish (Spain)

Each translation file:
- Imports `Dictionary` type from `@ecxus/ui/translations`
- Imports the component's translation type
- Exports a const typed as `Dictionary<ComponentTranslations>`

## Steps

1. **Find the component's translations.ts:**
   Read the `translations.ts` file to understand the `translationKey` and the type shape.

2. **Locate the 3 language files:**
   Based on the translation key namespace, find the corresponding files in each language directory.
   Pattern: `app:module.{module}.page.{pageName}` → `translations/{locale}/module/{module}/page/{pageName}.ts`
   Pattern: `app:module.{module}.component.{componentName}` → `translations/{locale}/module/{module}/components/{componentName}.ts`

3. **Update the translation type** (if adding new keys):
   Add new properties to the type in the component's `translations.ts`.

4. **Update all 3 language files:**
   - **pt-BR:** Use the Portuguese values provided by the user
   - **en-US:** Translate to English (use professional, UI-appropriate wording)
   - **es-ES:** Translate to Spanish (use professional, UI-appropriate wording)

   Maintain the same object structure across all 3 files. Use the same type import.

5. **Check if the translation is registered in the locale index:**
   Each language has an `index.ts` that imports and aggregates all translations.
   If the translation is new, add the import and register it in the translation object.

6. **Run typecheck** to verify types are correct:
   ```bash
   pnpm -F @automo/web typecheck
   ```

## Translation Style Guide

- **pt-BR:** Natural Brazilian Portuguese. Use "você" form. Title case for page titles, sentence case for labels.
- **en-US:** Standard American English. Title case for page titles, sentence case for labels.
- **es-ES:** Standard Spanish. Use "usted/tú" form matching existing translations. Title case for titles.
- Keep interpolation variables unchanged: `{{name}}`, `<bold>...</bold>`, `<br>...</br>`
- Placeholders like "Digite algo" → "Type something" → "Escriba algo"
- Action verbs: "Adicionar/Add/Agregar", "Editar/Edit/Editar", "Deletar/Delete/Eliminar", "Salvar/Save/Guardar"
