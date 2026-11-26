import * as process from 'process';
import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {z} from 'zod';
import {FileStorageType} from '@domain/file/entities';
import {getLocalIPAddress} from '@infrastructure/network';

export enum Env {
    DEVELOPMENT = 'development',
    PRODUCTION = 'production',
    TEST = 'test',
}

/** Placeholder used only outside production so local setups boot without configuration. */
export const DEV_FALLBACK_SECRET = 'super-secret';
const MIN_PRODUCTION_SECRET_LENGTH = 32;

export enum SignUpMode {
    /** Anyone can call POST /user/sign-up (development and tests). */
    OPEN = 'open',
    /** Sign-up requires the invite code in SIGN_UP_INVITE_CODE. */
    INVITE = 'invite',
    /** Public sign-up is off; accounts are created by clinic managers or support. */
    CLOSED = 'closed',
}

const booleanFlag = z.preprocess(
    (value) => (typeof value === 'string' ? ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase()) : value),
    z.boolean()
);

const envConfigShape = z.object({
    env: z.nativeEnum(Env).default(Env.DEVELOPMENT),
    port: z.coerce.number().default(3000),
    databaseUrl: z
        .string()
        .regex(/^postgresql:\/\/.*$/)
        .default('postgresql://postgres:postgres@localhost:5432/automo?schema=public'),
    cookieSecret: z.string().min(1).optional(),
    auth: z.object({
        cookieName: z.string().default('session.token'),
        token: z.object({
            expiration: z.coerce.number().default(24 * 3600), // 1 day in seconds
            secret: z.string().min(1).optional(),
        }),
    }),
    signUp: z.object({
        /** Defaults to OPEN outside production and CLOSED in production (see envConfig below). */
        mode: z.nativeEnum(SignUpMode).optional(),
        inviteCode: z.string().min(1).optional(),
    }),
    passwordReset: z.object({
        /** Lifetime of the e-mailed reset link, in seconds. */
        tokenExpiration: z.coerce
            .number()
            .int()
            .positive()
            .default(30 * 60),
        /** Base URL of the web app; the reset link points to `${webAppUrl}/auth/reset-password`. */
        webAppUrl: z.string().url().default('http://localhost:5000'),
    }),
    http: z.object({
        /** Express `trust proxy` setting, so rate limits see the client IP behind a load balancer. */
        trustProxy: z.string().optional(),
        /** Serves Swagger UI at /api/docs. Defaults to off in production. */
        swaggerEnabled: booleanFlag.optional(),
        /** Rate limits on the public auth routes. Defaults to on, except in the test env. */
        rateLimitEnabled: booleanFlag.optional(),
    }),
    clinicMember: z.object({
        cookieName: z.string().default('current.clinic_member'),
    }),
    storage: z.object({
        type: z.nativeEnum(FileStorageType).default(FileStorageType.LOCAL),
        uploadFileMaxSize: z.coerce.number().default(5 * 1024 * 1024), // 5MB
        localUploadDir: z.string().default('./uploads'),
        publicBaseUrl: z.string(),
        s3: z
            .object({
                bucket: z.string().optional(),
                region: z.string().optional(),
                accessKeyId: z.string().optional(),
                secretAccessKey: z.string().optional(),
            })
            .default({}),
    }),
    mqtt: z.object({
        brokerUrl: z.string().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
    }),
    asaas: z.object({
        apiKey: z.string().default(''),
        env: z.enum(['sandbox', 'production']).default('sandbox'),
        webhookToken: z.string().default(''),
    }),
    mail: z
        .object({
            fromAddress: z.string().optional(),
            replyTo: z.string().optional(),
            region: z.string().default('sa-east-1'),
            accessKeyId: z.string().optional(),
            secretAccessKey: z.string().optional(),
            /** SES configuration set whose event destination publishes to SNS (delivery tracking). */
            configurationSet: z.string().optional(),
            /** SNS topic ARN accepted by the SES events webhook. Unset = webhook disabled. */
            eventsTopicArn: z.string().optional(),
        })
        .default({region: 'sa-east-1'}),
    evolutionApi: z
        .object({
            url: z.string().optional(),
            apiKey: z.string().optional(),
            timeoutMs: z.coerce.number().int().positive().default(10_000),
            /** Signs the per-clinic webhook token. Unset = no webhook is registered or accepted. */
            webhookSecret: z.string().optional(),
            /** Public base URL Evolution calls back (defaults to PUBLIC_BASE_URL). */
            webhookBaseUrl: z.string().optional(),
        })
        .default({timeoutMs: 10_000}),
});

/**
 * Production must never run on the development fallbacks: a known session secret lets
 * anyone forge a token. The check runs at load time, so the app fails at startup.
 */
const envConfig = envConfigShape
    .superRefine((config, ctx) => {
        if (config.env !== Env.PRODUCTION) return;

        const secrets = [
            {name: 'COOKIE_SECRET', value: config.cookieSecret, path: ['cookieSecret']},
            {name: 'AUTH_TOKEN_SECRET', value: config.auth.token.secret, path: ['auth', 'token', 'secret']},
        ];

        for (const {name, value, path} of secrets) {
            if (value === undefined || value === DEV_FALLBACK_SECRET || value.length < MIN_PRODUCTION_SECRET_LENGTH) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path,
                    message: `${name} must be set to a random value of at least ${MIN_PRODUCTION_SECRET_LENGTH} characters in production.`,
                });
            }
        }

        if (config.signUp.mode === SignUpMode.INVITE && config.signUp.inviteCode === undefined) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['signUp', 'inviteCode'],
                message: 'SIGN_UP_INVITE_CODE must be set when SIGN_UP_MODE is "invite".',
            });
        }
    })
    .transform((config) => {
        const isProd = config.env === Env.PRODUCTION;

        return {
            ...config,
            cookieSecret: config.cookieSecret ?? DEV_FALLBACK_SECRET,
            auth: {
                ...config.auth,
                token: {...config.auth.token, secret: config.auth.token.secret ?? DEV_FALLBACK_SECRET},
            },
            signUp: {
                ...config.signUp,
                mode: config.signUp.mode ?? (isProd ? SignUpMode.CLOSED : SignUpMode.OPEN),
            },
            http: {
                ...config.http,
                swaggerEnabled: config.http.swaggerEnabled ?? !isProd,
                rateLimitEnabled: config.http.rateLimitEnabled ?? config.env !== Env.TEST,
            },
        };
    });

export type EnvConfig = z.output<typeof envConfig>;

type EnvParse<T extends Record<string, unknown> = z.infer<typeof envConfigShape>> = {
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

    get signUp(): EnvConfig['signUp'] {
        return this.configService.getOrThrow('signUp', {infer: true});
    }

    get passwordReset(): EnvConfig['passwordReset'] {
        return this.configService.getOrThrow('passwordReset', {infer: true});
    }

    get http(): EnvConfig['http'] {
        return this.configService.getOrThrow('http', {infer: true});
    }

    get clinicMember(): EnvConfig['clinicMember'] {
        return this.configService.getOrThrow('clinicMember', {infer: true});
    }

    get storage(): EnvConfig['storage'] {
        return this.configService.getOrThrow('storage', {infer: true});
    }

    get mqtt(): EnvConfig['mqtt'] {
        return this.configService.getOrThrow('mqtt', {infer: true});
    }

    get asaas(): EnvConfig['asaas'] {
        return this.configService.getOrThrow('asaas', {infer: true});
    }

    get mail(): EnvConfig['mail'] {
        return this.configService.getOrThrow('mail', {infer: true});
    }

    get evolutionApi(): EnvConfig['evolutionApi'] {
        return this.configService.getOrThrow('evolutionApi', {infer: true});
    }

    get isProd(): boolean {
        return this.env === Env.PRODUCTION;
    }

    get isDev(): boolean {
        return this.env === Env.DEVELOPMENT;
    }

    get isTest(): boolean {
        return this.env === Env.TEST;
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
            signUp: {
                mode: process.env.SIGN_UP_MODE,
                inviteCode: process.env.SIGN_UP_INVITE_CODE,
            },
            passwordReset: {
                tokenExpiration: process.env.PASSWORD_RESET_TOKEN_EXPIRATION,
                webAppUrl: process.env.WEB_APP_URL,
            },
            http: {
                trustProxy: process.env.TRUST_PROXY,
                swaggerEnabled: process.env.SWAGGER_ENABLED,
                rateLimitEnabled: process.env.RATE_LIMIT_ENABLED,
            },
            clinicMember: {
                cookieName: process.env.CLINIC_MEMBER_COOKIE_NAME ?? process.env.COMPANY_COOKIE_NAME,
            },
            storage: {
                type: process.env.STORAGE_TYPE,
                localUploadDir: process.env.LOCAL_UPLOAD_DIR,
                uploadFileMaxSize: process.env.UPLOAD_FILE_MAX_SIZE,
                publicBaseUrl:
                    process.env.PUBLIC_BASE_URL ?? `http://${getLocalIPAddress()}:${process.env.PORT ?? 3000}`,
                s3: {
                    bucket: process.env.STORAGE_S3_BUCKET,
                    region: process.env.STORAGE_S3_REGION,
                    accessKeyId: process.env.STORAGE_S3_ACCESS_KEY_ID,
                    secretAccessKey: process.env.STORAGE_S3_SECRET_ACCESS_KEY,
                },
            },
            mqtt: {
                brokerUrl: process.env.MQTT_BROKER_URL,
                username: process.env.MQTT_USERNAME,
                password: process.env.MQTT_PASSWORD,
            },
            asaas: {
                apiKey: process.env.ASAAS_API_KEY,
                env: process.env.ASAAS_ENV,
                webhookToken: process.env.ASAAS_WEBHOOK_TOKEN,
            },
            mail: {
                fromAddress: process.env.MAIL_FROM_ADDRESS,
                replyTo: process.env.MAIL_REPLY_TO,
                region: process.env.MAIL_SES_REGION,
                accessKeyId: process.env.MAIL_SES_ACCESS_KEY_ID,
                secretAccessKey: process.env.MAIL_SES_SECRET_ACCESS_KEY,
                configurationSet: process.env.MAIL_SES_CONFIGURATION_SET,
                eventsTopicArn: process.env.MAIL_SES_EVENTS_TOPIC_ARN,
            },
            evolutionApi: {
                url: process.env.EVOLUTION_SERVER_URL,
                apiKey: process.env.EVOLUTION_AUTHENTICATION_API_KEY,
                timeoutMs: process.env.EVOLUTION_TIMEOUT_MS,
                webhookSecret: process.env.EVOLUTION_WEBHOOK_SECRET,
                webhookBaseUrl: process.env.EVOLUTION_WEBHOOK_BASE_URL,
            },
        } satisfies EnvParse);
    }
}
