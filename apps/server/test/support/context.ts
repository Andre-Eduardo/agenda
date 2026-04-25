import {randomBytes} from 'node:crypto';
import {World, setWorldConstructor} from '@cucumber/cucumber';
import {Test} from '@nestjs/testing';
import type {NestExpressApplication} from '@nestjs/platform-express';
import * as supertest from 'supertest';
import {AppModule} from '../../src/app.module';
import {setupApp} from '../../src/infrastructure/setup';
import {Logger} from '../../src/application/@shared/logger';
import type {Log} from '../../src/application/@shared/logger';
import {PrismaService} from '../../src/infrastructure/repository/prisma';
import {chai} from './chai-setup';
import {resolveReferences} from './parser';

// ---------------------------------------------------------------------------
// Silent logger — only prints errors so test output stays clean
// ---------------------------------------------------------------------------
class ConsoleErrorLogger extends Logger {
    log(log: Log): void {
        if (log.level === 'error') {
            console.error(`[TEST ERROR] ${log.message}`, log.details ?? '');
        }
    }
}

// ---------------------------------------------------------------------------
// Variable types — extend as new domain entities are added
// ---------------------------------------------------------------------------
export type VariableIdType =
    | 'user'
    | 'clinic'
    | 'clinicMember'
    | 'professional'
    | 'patient'
    | 'appointment'
    | 'record'
    | 'form-template'
    | 'patient-form'
    | string;

export type Variables = {
    /** Unique 8-char hex suffix appended to usernames/emails in each scenario.
     *  Prevents collisions between parallel test workers. */
    contextId: string;
    /** Body of the most recent HTTP response — useful for response assertions. */
    lastResponse?: unknown;
    /** Named entity IDs collected during a scenario (e.g., after a POST /user/sign-up). */
    ids: {
        user: Record<string, string>;
        clinic: Record<string, string>;
        clinicMember: Record<string, string>;
        professional: Record<string, string>;
        patient: Record<string, string>;
        appointment: Record<string, string>;
        record: Record<string, string>;
        'form-template': Record<string, string>;
        'patient-form': Record<string, string>;
        [key: string]: Record<string, string>;
    };
};

// ---------------------------------------------------------------------------
// Main test context — one instance per Cucumber scenario
// ---------------------------------------------------------------------------
export class Context extends World {
    public app!: NestExpressApplication;
    public variables: Variables = {
        contextId: randomBytes(4).toString('hex'),
        ids: {
            user: {},
            clinic: {},
            clinicMember: {},
            professional: {},
            patient: {},
            appointment: {},
            record: {},
            'form-template': {},
            'patient-form': {},
        },
    };

    private superagent?: supertest.Agent;

    // ── HTTP agent ──────────────────────────────────────────────────────────

    public get agent(): supertest.Agent {
        this.superagent ??= supertest.agent(this.app.getHttpServer());

        return this.superagent;
    }

    /** Clears the current HTTP agent (drops session cookies). */
    public clearAgent(): void {
        this.superagent = undefined;
    }

    // ── Database access ─────────────────────────────────────────────────────

    public get prisma(): PrismaService {
        return this.app.get(PrismaService);
    }

    // ── App lifecycle ───────────────────────────────────────────────────────

    public async start(): Promise<void> {
        // Env vars must be set before the module compiles so that config
        // service picks them up correctly.
        process.env['TZ'] = 'UTC';
        process.env['NODE_ENV'] = 'test';
        process.env['STORAGE_TYPE'] = 'LOCAL';
        process.env['LOCAL_UPLOAD_DIR'] = './test-files';
        process.env['PUBLIC_BASE_URL'] = 'http://localhost:3333';
        // MQTT is disabled in tests: without MQTT_BROKER_URL the service skips
        // connection silently.
        delete process.env['MQTT_BROKER_URL'];
        // AI providers default to mock when no env vars are set.

        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(Logger)
            .useClass(ConsoleErrorLogger)
            .compile();

        this.app = moduleRef.createNestApplication<NestExpressApplication>();

        // setupApp registers global prefix (api), URI versioning (v1),
        // cookieParser, helmet, compression, and CORS.
        setupApp(this.app);

        await this.app.init();
    }

    public async stop(): Promise<void> {
        try {
            await this.prisma.$disconnect();
            await this.app.close();
        } catch (error) {
            console.error('Failed to teardown test environment:', error);
        }
    }

    // ── Variable helpers ────────────────────────────────────────────────────

    /**
     * Stores an entity ID under (idType, key).
     * Example: context.setVariableId('user', 'john_doe', 'uuid-here')
     */
    public setVariableId(idType: VariableIdType, key: string, id: string): void {
        if (!this.variables.ids[idType]) {
            this.variables.ids[idType] = {};
        }

        this.variables.ids[idType][key] = id;
    }

    /**
     * Retrieves a stored entity ID, throwing if not found.
     * Example: context.getVariableId('user', 'john_doe')
     */
    public getVariableId(idType: VariableIdType, key: string): string {
        const id = this.variables.ids[idType]?.[key];

        if (id === undefined) {
            throw new Error(`Variable ID not found: [${idType}] "${key}". Available: ${Object.keys(this.variables.ids[idType] ?? {}).join(', ')}`);
        }

        return id;
    }

    /**
     * Returns value with the scenario's contextId appended.
     * Use for usernames, emails, etc. to avoid collisions between parallel runs.
     * Example: context.getUniqueValue('john_doe') → 'john_doe_a1b2c3d4'
     */
    public getUniqueValue(value: string): string {
        return `${value}_${this.variables.contextId}`;
    }

    /**
     * Strips the contextId suffix that was added by getUniqueValue.
     */
    public extractUniqueValue(value: string): string {
        return value.replace(`_${this.variables.contextId}`, '');
    }

    // ── Assertion helpers ───────────────────────────────────────────────────

    /**
     * Asserts that `data` matches a JSON pattern string.
     * ${ref:...} placeholders in the pattern are resolved before comparison.
     *
     * Uses chai-match-pattern for structural matching (supports wildcards, _.isEntityId, etc.).
     */
    public testMatchPattern(data: unknown, pattern: string): void {
        const resolved = resolveReferences(this, pattern);

        // Pattern may be a JSON string literal or a raw value
        let parsed: string | object;

        try {
            parsed = JSON.parse(resolved) as string | object;
        } catch {
            parsed = resolved;
        }

        chai.expect(data).to.matchPattern(parsed);
    }
}

setWorldConstructor(Context);
