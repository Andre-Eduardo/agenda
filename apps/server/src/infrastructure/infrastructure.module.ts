import {Module} from '@nestjs/common';
import {ClsModule} from 'nestjs-cls';
import {AiProviderModule} from '@infrastructure/ai-provider/ai-provider.module';
import {AuthModule} from '@infrastructure/auth/auth.module';
import {ConfigModule} from '@infrastructure/config';
import {EventModule} from '@infrastructure/event';
import {LoggerModule} from '@infrastructure/logger';
import {RepositoryModule} from '@infrastructure/repository';
import {StorageModule} from '@infrastructure/storage/storage.module';

const sharedModules = [
    ClsModule.forRoot({global: true}),
    AuthModule,
    ConfigModule,
    EventModule,
    LoggerModule.register(),
    RepositoryModule,
    StorageModule,
    AiProviderModule,
];

@Module({
    imports: sharedModules,
    exports: sharedModules,
})
export class InfrastructureModule {}
