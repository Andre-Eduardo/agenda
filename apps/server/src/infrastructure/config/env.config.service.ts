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
            expiration: z.coerce.number().default(24 * 3600), // 1 day in seconds
            secret: z.string().default('super-secret'),
        }),
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

    get clinicMember(): EnvConfig['clinicMember'] {
        return this.configService.getOrThrow('clinicMember', {infer: true});
    }

    get storage(): EnvConfig['storage'] {
        return this.configService.getOrThrow('storage', {infer: true});
    }

    get mqtt(): EnvConfig['mqtt'] {
        return this.configService.getOrThrow('mqtt', {infer: true});
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
        } satisfies EnvParse);
    }
}
