import * as fs from 'node:fs';
import type {INestApplication} from '@nestjs/common';
import {VersioningType} from '@nestjs/common';
import type {NestExpressApplication} from '@nestjs/platform-express';
import type {OpenAPIObject} from '@nestjs/swagger';
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import {FileStorageType} from '@domain/file/entities';
import {TokenProvider} from '@domain/user/token';
import {EnvConfigService} from '@infrastructure/config';
import {UPLOADS_ROUTE, createProtectedUploadsHandlers} from '@infrastructure/storage/protected-uploads.handler';

export type SetupAppResult = {
    port: number;
    /** Null when Swagger UI is disabled (the default in production). */
    docsPath: string | null;
};

export function setupApp(app: NestExpressApplication): SetupAppResult {
    process.env.TZ = 'UTC';

    const globalPrefix = 'api';

    app.setGlobalPrefix(globalPrefix);
    app.enableVersioning({
        type: VersioningType.URI,
        prefix: 'v',
        defaultVersion: '1',
    });

    const configService = app.get(EnvConfigService);

    const {port} = configService;

    const {swaggerEnabled, trustProxy} = configService.http;
    let docsPath: string | null = null;

    // The OpenAPI document is built only when someone needs it: Swagger UI (off by default in
    // production, so the API surface is not published) or the dev-time openapi.json export.
    if (swaggerEnabled || configService.isDev) {
        const document = buildOpenApiDocument(app, port);

        if (swaggerEnabled) {
            docsPath = `${globalPrefix}/docs`;
            SwaggerModule.setup(docsPath, app, document);
        }

        if (configService.isDev) {
            fs.writeFileSync('./openapi.json', JSON.stringify(document, null, 2));
        }
    }

    if (trustProxy !== undefined) {
        // Behind a load balancer, request.ip must be the client IP for the auth rate limits.
        app.set('trust proxy', parseTrustProxy(trustProxy));
    }

    // Amazon SNS posts its JSON with `Content-Type: text/plain` (SES delivery webhook, L2-04).
    app.useBodyParser('text', {type: 'text/plain', limit: '256kb'});
    app.use(helmet());
    app.use(compression());
    app.use(cookieParser(configService.cookieSecret));

    if (configService.storage.type === FileStorageType.LOCAL) {
        // Needs the signed cookies parsed above: local uploads are only served to signed-in users.
        app.use(
            UPLOADS_ROUTE,
            ...createProtectedUploadsHandlers(
                configService.storage.localUploadDir,
                configService.auth.cookieName,
                app.get(TokenProvider)
            )
        );
    }

    app.set('query parser', 'extended');

    if (configService.isDev || configService.isTest) {
        app.enableCors({
            origin: true,
            credentials: true,
        });
    }

    return {
        port,
        docsPath,
    };
}

/**
 * Accepts the values Express understands: `true`/`false`, a hop count (`1`) or a list of
 * addresses/subnets (`loopback, 10.0.0.0/8`).
 */
export function parseTrustProxy(value: string): boolean | number | string {
    const normalized = value.trim().toLowerCase();

    if (normalized === 'true') return true;

    if (normalized === 'false' || normalized === '') return false;

    if (/^\d+$/.test(normalized)) return Number(normalized);

    return value.trim();
}

function buildOpenApiDocument(app: INestApplication, port: number): OpenAPIObject {
    const config = new DocumentBuilder()
        .setTitle('Automo API')
        .setDescription(
            'The backend API for the Automo project' +
                `<h3>Authentication</h3>
                For the protected routes, you must first <b>sign up</b> (<code>/user/sign-up</code>) and then <b>sign in</b> (<code>/auth/sign-in</code>).
                After that, you already can request the protected routes.
                The API will return a token that will be included automatically in the cookie and will be sent in subsequent requests for authentication.
                To sign out, simply make a request to the <code>/auth/sign-out</code> endpoint,
                the token will be invalidated and removed from the cookie.`
        )
        .setVersion(process.env.npm_package_version ?? 'unknown')
        .addServer(`http://127.0.0.1:${port}`, 'Local development server')
        .build();

    return SwaggerModule.createDocument(app, config, {
        // This requires that all controller methods have a unique name.
        operationIdFactory: (_, methodKey) => methodKey,
    });
}
