import playwright from 'eslint-plugin-playwright';
import {defineConfig} from 'eslint/config';

export default defineConfig([
    {
        files: ['tests/**'],
        extends: [playwright.configs['flat/recommended']],
        rules: {
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
