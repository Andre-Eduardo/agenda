import {EnvConfigService, SignUpMode} from '../env.config.service';

// The loader reads a module-level `process.env`, so the tests mutate it in place instead of replacing it.
const snapshot = {...process.env};

function setEnv(values: Record<string, string | undefined>): void {
    for (const key of Object.keys(process.env)) delete process.env[key];

    Object.assign(process.env, snapshot);

    for (const [key, value] of Object.entries(values)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
    }
}

describe('Environment configuration in production', () => {
    afterEach(() => setEnv({}));

    const strongSecret = 'x'.repeat(48);

    beforeEach(() => {
        setEnv({
            NODE_ENV: 'production',
            PUBLIC_BASE_URL: 'https://api.example.com',
            COOKIE_SECRET: strongSecret,
            AUTH_TOKEN_SECRET: `${strongSecret}y`,
            SIGN_UP_MODE: undefined,
            SIGN_UP_INVITE_CODE: undefined,
            SWAGGER_ENABLED: undefined,
            RATE_LIMIT_ENABLED: undefined,
        });
    });

    it('loads with strong secrets and safe defaults', () => {
        const config = EnvConfigService.load();

        expect(config.cookieSecret).toBe(strongSecret);
        expect(config.signUp.mode).toBe(SignUpMode.CLOSED);
        expect(config.http.swaggerEnabled).toBe(false);
        expect(config.http.rateLimitEnabled).toBe(true);
    });

    it.each(['COOKIE_SECRET', 'AUTH_TOKEN_SECRET'])('fails when %s is missing', (name) => {
        delete process.env[name];

        expect(() => EnvConfigService.load()).toThrow(name);
    });

    it.each(['super-secret', 'short'])('fails when a secret is weak (%s)', (value) => {
        process.env.AUTH_TOKEN_SECRET = value;

        expect(() => EnvConfigService.load()).toThrow('AUTH_TOKEN_SECRET');
    });

    it('requires an invite code in invite mode', () => {
        process.env.SIGN_UP_MODE = 'invite';

        expect(() => EnvConfigService.load()).toThrow('SIGN_UP_INVITE_CODE');

        process.env.SIGN_UP_INVITE_CODE = 'code';

        expect(EnvConfigService.load().signUp).toEqual({mode: SignUpMode.INVITE, inviteCode: 'code'});
    });

    it('lets Swagger be turned on explicitly', () => {
        process.env.SWAGGER_ENABLED = 'true';

        expect(EnvConfigService.load().http.swaggerEnabled).toBe(true);
    });
});

describe('Environment configuration outside production', () => {
    afterEach(() => setEnv({}));

    it('falls back to the dev secret and keeps sign-up and Swagger open', () => {
        setEnv({
            NODE_ENV: 'development',
            COOKIE_SECRET: undefined,
            AUTH_TOKEN_SECRET: undefined,
            SIGN_UP_MODE: undefined,
            SWAGGER_ENABLED: undefined,
        });

        const config = EnvConfigService.load();

        expect(config.cookieSecret).toBe('super-secret');
        expect(config.auth.token.secret).toBe('super-secret');
        expect(config.signUp.mode).toBe(SignUpMode.OPEN);
        expect(config.http.swaggerEnabled).toBe(true);
    });

    it('turns rate limits off in the test env by default', () => {
        setEnv({NODE_ENV: 'test', RATE_LIMIT_ENABLED: undefined});

        expect(EnvConfigService.load().http.rateLimitEnabled).toBe(false);
    });
});
