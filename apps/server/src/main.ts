// Must be the first import so the OpenTelemetry SDK patches http/express/prisma/etc.
// before any other module loads them.
// oxlint-disable-next-line import/no-unassigned-import -- side effect: starts the OpenTelemetry SDK
import './infrastructure/telemetry/register';
import {NestFactory} from '@nestjs/core';
import {NestExpressApplication} from '@nestjs/platform-express';
import {Logger} from '@application/@shared/logger';
import {NestWinstonLogger} from '@infrastructure/logger';
import {setupApp} from '@infrastructure/setup';
import {AppModule} from './app.module';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {bufferLogs: true});

    app.useLogger(new NestWinstonLogger());
    // Flushes pending telemetry on SIGTERM (TelemetryShutdownService).
    app.enableShutdownHooks();

    const {port, docsPath} = setupApp(app);

    const logger = await app.resolve(Logger);

    // The app only works with IPv4, to work with IPv6 it's necessary to remove the hostname parameter
    // and also adjust the code that uses the remote IP address from requests.
    await app.listen(port, '0.0.0.0');

    const appUrl = await app.getUrl();

    logger.info(`Application running at ${appUrl}`);

    if (docsPath !== null) {
        logger.info(`API documentation available at ${appUrl}/${docsPath}`);
    }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises -- This is the entry point of the application
bootstrap();
