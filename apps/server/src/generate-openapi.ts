/* istanbul ignore file */

import {NestFactory} from '@nestjs/core';
import type {NestExpressApplication} from '@nestjs/platform-express';
import {setupApp} from '@infrastructure/setup';
import {AppModule} from './app.module';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    setupApp(app);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises -- This is the entry point
bootstrap();
