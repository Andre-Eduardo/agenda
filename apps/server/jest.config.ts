import type {Config} from 'jest';

const config: Config = {
    testEnvironment: 'node',
    restoreMocks: true,
    resetMocks: true,
    clearMocks: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.module.ts',
        '!src/main.ts',
        '!src/infrastructure/setup.ts',
        '!src/infrastructure/openapi/schema-generator.ts',
        '!src/domain/**/events/index.ts',
        '!src/domain/event/event.type.ts',
    ],
    coverageThreshold: {
        global: {
            branches: 100,
            functions: 100,
            statements: 100,
            lines: 100,
        },
    },
    testMatch: ['<rootDir>/src/**/__tests__/*.test.ts'],
    transform: {
        '^.+\\.ts$': [
            '@swc/jest',
            {
                jsc: {
                    parser: {
                        syntax: 'typescript',
                        decorators: true,
                    },
                    transform: {
                        legacyDecorator: true,
                    },
                },
            },
        ],
    },
    setupFilesAfterEnv: ['<rootDir>/.jest/setup.ts', 'jest-extended/all'],
    globalSetup: '<rootDir>/.jest/global-setup.ts',
};

export default config;
