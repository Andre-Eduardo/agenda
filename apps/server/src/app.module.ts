import {Module} from '@nestjs/common';
import {ScheduleModule} from '@nestjs/schedule';
import {ApplicationModule} from '@application/application.module';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';
import {LoggerModule} from '@infrastructure/logger';
import {TelemetryModule} from '@infrastructure/telemetry';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        TelemetryModule,
        ApplicationModule,
        InfrastructureModule,
        LoggerModule.register('App'),
    ],
})
export class AppModule {}
