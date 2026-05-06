import path from 'node:path';
import {includeIgnoreFile} from '@eslint/compat';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import {defineConfig} from 'eslint/config';
import tseslint from 'typescript-eslint';

const gitignorePath = path.resolve('.', '.gitignore');

export default defineConfig([
    includeIgnoreFile(gitignorePath),
    {
        ignores: ['vite.config.ts', 'src/routeTree.gen.ts', 'src/components/ui/**', 'dist/**', '.tanstack/**'],
    },
    ...tseslint.configs.recommendedTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    react.configs.flat.recommended,
    react.configs.flat['jsx-runtime'],
    {
        plugins: {
            'react-hooks': reactHooks,
            'jsx-a11y': jsxA11y,
        },
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        settings: {
            react: {version: 'detect'},
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            ...jsxA11y.flatConfigs.recommended.rules,
            '@typescript-eslint/only-throw-error': 'off',
            '@typescript-eslint/consistent-type-imports': 'error',
            'no-restricted-imports': [
                'error',
                {
                    importNames: ['default'],
                    message: 'Do not use React qualifier, use import deconstruction instead.',
                    name: 'react',
                },
            ],
        },
    },
    {
        files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
        rules: {
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/unbound-method': 'off',
        },
    },
]);
