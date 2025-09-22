import {Module} from '@nestjs/common';
import {ApplicationModule} from './application/application.module';
import {InfrastructureModule} from './infrastructure/infrastructure.module';
import {LoggerModule} from './infrastructure/logger';

@Module({
    imports: [ApplicationModule, InfrastructureModule, LoggerModule.register('App')],
})
export class AppModule {}
