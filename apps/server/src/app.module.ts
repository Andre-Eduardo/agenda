import {Module} from '@nestjs/common';
import {ApplicationModule} from './application/application.module';
import {DomainModule} from './domain/domain.module';
import {InfrastructureModule} from './infrastructure/infrastructure.module';
import {LoggerModule} from './infrastructure/logger';

@Module({
    imports: [ApplicationModule, DomainModule, InfrastructureModule, LoggerModule.register('App')],
})
export class AppModule {}
