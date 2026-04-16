import * as fs from 'node:fs';
import type {INestApplication} from '@nestjs/common';
import {VersioningType} from '@nestjs/common';
import type {NestExpressApplication} from '@nestjs/platform-express';
import type {OpenAPIObject} from '@nestjs/swagger';
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import {EnvConfigService} from './config';

export type SetupAppResult = {
    port: number;
    docsPath: string;
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

    const {docsPath, document} = setupSwagger(app, globalPrefix, port);

    if (configService.isDev) {
        fs.writeFileSync('./openapi.json', JSON.stringify(document, null, 2));
    }

    app.use(helmet());
    app.use(compression());
    app.use(cookieParser(configService.cookieSecret));
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

function setupSwagger(
    app: INestApplication,
    globalPrefix: string,
    port: number
): {document: OpenAPIObject; docsPath: string} {
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

    const document = SwaggerModule.createDocument(app, config, {
        // This requires that all controller methods have a unique name.
        operationIdFactory: (_, methodKey) => methodKey,
    });
    const docsPath = `${globalPrefix}/docs`;

    SwaggerModule.setup(docsPath, app, document);

    return {
        document,
        docsPath,
    };
}
