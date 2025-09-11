import {Module} from '@nestjs/common';
import {AuthModule} from './auth/auth.module';
import {ConfigModule} from './config';
import {EventModule} from './event';
import {LoggerModule} from './logger';
import {RepositoryModule} from './repository';
import {StateMachineModule} from './state-machine/state-machine.module';

const sharedModules = [
    AuthModule,
    ConfigModule,
    EventModule,
    LoggerModule.register(),
    RepositoryModule,
    StateMachineModule,
];

@Module({
    imports: sharedModules,
    exports: sharedModules,
})
export class InfrastructureModule {}
