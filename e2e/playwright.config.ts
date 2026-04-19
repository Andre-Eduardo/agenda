import path from 'node:path';
import * as process from 'node:process';
import {defineConfig, devices} from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5000';
const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export default defineConfig({
    testDir: './tests',
    timeout: 30 * 1000,
    testMatch: '**/*.test.ts',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: 1,
    maxFailures: process.env.CI ? 1 : undefined,
    reporter: [
        ['html', {outputFolder: 'playwright-report'}],
        ['json', {outputFile: 'test-results/results.json'}],
        ['junit', {outputFile: 'test-results/junit.xml'}],
        ['list'],
    ],
    snapshotPathTemplate: 'screenshots/{testFilePath}/{arg}_{projectName}{ext}',
    updateSnapshots: process.env.CI ? 'none' : 'missing',
    expect: {timeout: 10 * 1000},
    use: {
        baseURL: BASE_URL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'on-first-retry',
        viewport: {width: 1280, height: 720},
        locale: 'pt-BR',
        timezoneId: 'America/Sao_Paulo',
    },
    projects: [
        {name: 'desktop-chrome', use: {...devices['Desktop Chrome']}},
        {name: 'tablet-chrome', use: {...devices['Galaxy Tab S4']}},
        {name: 'mobile-chrome', use: {...devices['Galaxy S24']}},
    ],
    webServer: [
        {
            command: 'pnpm -F @agenda-app/server start:dev',
            url: `${API_URL}/api/docs`,
            reuseExistingServer: true,
            timeout: 120 * 1000,
            cwd: path.join(__dirname, '..'),
        },
        {
            command: 'pnpm -F @agenda-app/app dev',
            url: BASE_URL,
            reuseExistingServer: true,
            timeout: 120 * 1000,
            cwd: path.join(__dirname, '..'),
        },
    ],
});
