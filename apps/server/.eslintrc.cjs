module.exports = {
    root: true,
    extends: [
        'plugin:@my-lint/typescript',
        'plugin:@my-lint/test',
    ],
    ignorePatterns: [
        'jest.config.ts',
    ],
    rules: {
        // This rule doesn't play well with NestJS file naming conventions like `app.controller.ts`
        'import/extensions': 'off',
    },
    overrides: [
        /**
         * This helps to DI interfaces without the need to create a symbol/const that references interfaces and call
         * @Inject everywhere the implementation is needed.
         * This happens because the interfaces are not present at runtime so can't be used by Nest as provide key
         * when injecting the dependency implementation. But abstract class makes this possible,
         * so merging interface declaration and abstract class solves the limitation.
         */
        {
            files: [
                'src/**/*.ts',
            ],
            rules: {
                '@typescript-eslint/no-unsafe-declaration-merging': 'off',
            },
        },
        {
            files: [
                'test/**/*.ts',
            ],
            rules: {
                '@typescript-eslint/no-unused-expressions': 'off',
                'func-names': 'off',
            },
        },
    ],
};
