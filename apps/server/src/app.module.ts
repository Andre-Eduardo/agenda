import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { ApplicationModule } from "@application/application.module";
import { InfrastructureModule } from "@infrastructure/infrastructure.module";
import { LoggerModule } from "@infrastructure/logger";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ApplicationModule,
    InfrastructureModule,
    LoggerModule.register("App"),
  ],
})
export class AppModule {}
