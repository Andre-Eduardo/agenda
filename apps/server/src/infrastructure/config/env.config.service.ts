import * as process from 'process';
import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {z} from 'zod';

export enum Env {
    DEVELOPMENT = 'development',
    PRODUCTION = 'production',
}

const envConfig = z.object({
    env: z.nativeEnum(Env).default(Env.DEVELOPMENT),
    port: z.coerce.number().default(3000),
    databaseUrl: z
        .string()
        .regex(/^postgresql:\/\/.*$/)
        .default('postgresql://postgres:postgres@localhost:5432/automo?schema=public'),
    cookieSecret: z.string().default('super-secret'),
    auth: z.object({
        cookieName: z.string().default('session.token'),
        token: z.object({
            expiration: z.coerce.number().default(24 * 3600), // 1 day
            secret: z.string().default('super-secret'),
        }),
    }),
    company: z.object({
        cookieName: z.string().default('current.company'),
    }),
});

export type EnvConfig = z.infer<typeof envConfig>;

type EnvParse<T extends Record<string, unknown> = EnvConfig> = {
    [K in keyof T]: T[K] extends Record<string, unknown> ? EnvParse<T[K]> : string | undefined;
};

@Injectable()
export class EnvConfigService {
    constructor(private readonly configService: ConfigService<EnvConfig>) {}

    get env(): Env {
        return this.configService.getOrThrow('env', {infer: true});
    }

    get port(): number {
        return this.configService.getOrThrow('port', {infer: true});
    }

    get cookieSecret(): EnvConfig['cookieSecret'] {
        return this.configService.getOrThrow('cookieSecret', {infer: true});
    }

    get auth(): EnvConfig['auth'] {
        return this.configService.getOrThrow('auth', {infer: true});
    }

    get company(): EnvConfig['company'] {
        return this.configService.getOrThrow('company', {infer: true});
    }

    get isProd(): boolean {
        return this.env === Env.PRODUCTION;
    }

    get isDev(): boolean {
        return this.env === Env.DEVELOPMENT;
    }

    static load(): EnvConfig {
        return envConfig.parse({
            env: process.env.NODE_ENV,
            port: process.env.PORT,
            databaseUrl: process.env.DATABASE_URL,
            cookieSecret: process.env.COOKIE_SECRET,
            auth: {
                cookieName: process.env.AUTH_COOKIE_NAME,
                token: {
                    expiration: process.env.AUTH_TOKEN_EXPIRATION,
                    secret: process.env.AUTH_TOKEN_SECRET,
                },
            },
            company: {
                cookieName: process.env.COMPANY_COOKIE_NAME,
            },
        } satisfies EnvParse);
    }
}
