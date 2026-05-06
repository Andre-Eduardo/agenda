import path from 'node:path';
import {includeIgnoreFile} from '@eslint/compat';
import {defineConfig} from 'eslint/config';
import tseslint from 'typescript-eslint';

const gitignorePath = path.resolve('.', '.gitignore');

export default defineConfig([
    includeIgnoreFile(gitignorePath),
    {
        ignores: ['jest.config.ts', '.jest/**', 'dist/**', 'openapi.json', 'prisma/**', 'scripts/**'],
    },
    ...tseslint.configs.recommendedTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        files: ['src/**/*.ts'],
        rules: {
            /**
             * This helps to DI interfaces without the need to create a symbol/const that references interfaces and call
             * @Inject everywhere the implementation is needed.
             * This happens because the interfaces are not present at runtime so can't be used by Nest as provide key
             * when injecting the dependency implementation. But abstract class makes this possible,
             * so merging interface declaration and abstract class solves the limitation.
             */
            '@typescript-eslint/no-unsafe-declaration-merging': 'off',
            'no-restricted-imports': [
                'error',
                {
                    message: 'Use the value object BigDecimal instead',
                    name: 'bignumber.js',
                },
            ],
        },
    },
    {
        files: ['test/**/*.ts', '**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
        rules: {
            '@typescript-eslint/no-unused-expressions': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/unbound-method': 'off',
            'func-names': 'off',
        },
    },
    {
        files: ['cucumber.mjs', '*.config.{js,mjs,cjs}'],
        rules: {
            'no-undef': 'off',
            'no-console': 'off',
            'no-underscore-dangle': 'off',
        },
    },
]);
