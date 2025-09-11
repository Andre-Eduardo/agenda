import {Module} from '@nestjs/common';
import {ConfigModule as NestConfigModule} from '@nestjs/config';
import {EnvConfigService} from './env.config.service';

@Module({
    imports: [
        NestConfigModule.forRoot({
            load: [() => EnvConfigService.load()],
        }),
    ],
    providers: [EnvConfigService],
    exports: [EnvConfigService],
})
export class ConfigModule {}
