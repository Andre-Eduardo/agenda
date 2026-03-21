import {Module} from '@nestjs/common';
import {ClsModule} from 'nestjs-cls';
import {AuthModule} from './auth/auth.module';
import {ConfigModule} from './config';
import {EventModule} from './event';
import {LoggerModule} from './logger';
import {RepositoryModule} from './repository';
import {StorageModule} from './storage/storage.module';

const sharedModules = [
    ClsModule.forRoot({global: true}),
    AuthModule,
    ConfigModule,
    EventModule,
    LoggerModule.register(),
    RepositoryModule,
    StorageModule,
];

@Module({
    imports: sharedModules,
    exports: sharedModules,
})
export class InfrastructureModule {}
