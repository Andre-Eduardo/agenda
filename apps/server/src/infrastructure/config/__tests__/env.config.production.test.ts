import {EnvConfigService, SignUpMode} from '../env.config.service';

describe('Environment configuration in production', () => {
    const original = process.env;
    const strongSecret = 'x'.repeat(48);

    beforeEach(() => {
        process.env = {
            ...original,
            NODE_ENV: 'production',
            PUBLIC_BASE_URL: 'https://api.example.com',
            COOKIE_SECRET: strongSecret,
            AUTH_TOKEN_SECRET: `${strongSecret}y`,
        };
        delete process.env.SIGN_UP_MODE;
        delete process.env.SIGN_UP_INVITE_CODE;
        delete process.env.SWAGGER_ENABLED;
        delete process.env.RATE_LIMIT_ENABLED;
    });

    afterEach(() => {
        process.env = original;
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
    const original = process.env;

    afterEach(() => {
        process.env = original;
    });

    it('falls back to the dev secret and keeps sign-up and Swagger open', () => {
        process.env = {...original, NODE_ENV: 'development'};
        delete process.env.COOKIE_SECRET;
        delete process.env.AUTH_TOKEN_SECRET;
        delete process.env.SIGN_UP_MODE;
        delete process.env.SWAGGER_ENABLED;

        const config = EnvConfigService.load();

        expect(config.cookieSecret).toBe('super-secret');
        expect(config.auth.token.secret).toBe('super-secret');
        expect(config.signUp.mode).toBe(SignUpMode.OPEN);
        expect(config.http.swaggerEnabled).toBe(true);
    });

    it('turns rate limits off in the test env by default', () => {
        process.env = {...original, NODE_ENV: 'test'};
        delete process.env.RATE_LIMIT_ENABLED;

        expect(EnvConfigService.load().http.rateLimitEnabled).toBe(false);
    });
});
