import {NestFactory} from '@nestjs/core';
import {NestExpressApplication} from '@nestjs/platform-express';
import {AppModule} from './app.module';
import {Logger} from './application/@shared/logger';
import {setupApp} from './infrastructure/setup';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    const {port, docsPath} = setupApp(app);

    const logger = await app.resolve(Logger);

    // The app only works with IPv4, to work with IPv6 it's necessary to remove the hostname parameter
    // and also adjust the code that uses the remote IP address from requests.
    await app.listen(port, '0.0.0.0');

    const appUrl = await app.getUrl();

    logger.info(`Application running at ${appUrl}`);
    logger.info(`API documentation available at ${appUrl}/${docsPath}`);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises -- This is the entry point of the application
bootstrap();
