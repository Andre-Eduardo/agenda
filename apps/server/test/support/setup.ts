import fs from 'node:fs';
import {execSync} from 'node:child_process';
import path from 'node:path';
import {After, Before, BeforeAll, setDefaultTimeout} from '@cucumber/cucumber';
import sinon from 'sinon';
import type {Context} from './context';

// ---------------------------------------------------------------------------
// Test database configuration
// ---------------------------------------------------------------------------
const DATABASE_USER = process.env['DATABASE_USER'] ?? 'postgres';
const DATABASE_PASSWORD = process.env['DATABASE_PASSWORD'] ?? 'postgres';
const DATABASE_HOST = process.env['DATABASE_HOST'] ?? 'localhost';
const DATABASE_PORT = process.env['DATABASE_PORT'] ?? '5432';
const TEST_DATABASE_NAME = 'test_integration_agenda';
const TEST_DATABASE_URL = `postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${TEST_DATABASE_NAME}`;

// ---------------------------------------------------------------------------
// Worker synchronisation
// Workers share a lock file: worker 0 runs migrations and creates the lock,
// all other workers poll until the lock exists before proceeding.
// ---------------------------------------------------------------------------
const LOCK_FILE = path.join(process.env['TEMP'] ?? '/tmp', 'agenda-integration-test.lock');
const PRISMA_BINARY = path.join(process.cwd(), 'node_modules', '.bin', 'prisma');

function setupDatabaseUrl(): void {
    process.env['DATABASE_URL'] = TEST_DATABASE_URL;
}

// ---------------------------------------------------------------------------
// Global timeout — 2 minutes per step (allows for slow DB/app init)
// ---------------------------------------------------------------------------
setDefaultTimeout(120 * 1000);

// ---------------------------------------------------------------------------
// BeforeAll — runs once per worker process
// Worker 0 is responsible for running Prisma migrations; all other workers
// wait for the lock file before starting.
// ---------------------------------------------------------------------------
BeforeAll(async function () {
    const workerId = process.env['CUCUMBER_WORKER_ID'];

    if (workerId === undefined || workerId === '0') {
        // Primary worker: run migrations against the test database
        setupDatabaseUrl();

        execSync(`"${PRISMA_BINARY}" migrate deploy`, {
            env: {...process.env, DATABASE_URL: TEST_DATABASE_URL},
            stdio: 'inherit',
        });

        // Signal other workers that the database is ready
        fs.writeFileSync(LOCK_FILE, '');
    } else {
        // Secondary workers: wait for the lock file
        while (!fs.existsSync(LOCK_FILE)) {
            await new Promise<void>((resolve) => setTimeout(resolve, 1000));
        }
    }
});

// ---------------------------------------------------------------------------
// Before — runs before each scenario
// Boots a fresh NestJS application connected to the test database.
// ---------------------------------------------------------------------------
Before({name: 'Boot application'}, async function (this: Context) {
    setupDatabaseUrl();
    await this.start();
});

// ---------------------------------------------------------------------------
// After — runs after each scenario
// Restores all sinon stubs and shuts down the application.
// ---------------------------------------------------------------------------
After({name: 'Teardown application'}, async function (this: Context) {
    sinon.restore();
    await this.stop();
});
