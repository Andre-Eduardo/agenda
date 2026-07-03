import playwright from 'eslint-plugin-playwright';
import {defineConfig} from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
    ...tseslint.configs.recommended,
    {
        files: ['tests/**/*.ts'],
        plugins: {playwright},
        rules: {
            ...playwright.configs['flat/recommended'].rules,
            'playwright/expect-expect': 'off',
        },
    },
    {
        files: ['fixtures/test.ts'],
        rules: {
            'no-empty-pattern': 'off',
        },
    },
    {
        ignores: ['node_modules/**', 'playwright-report/**', 'test-results/**', 'screenshots/**'],
    },
]);
