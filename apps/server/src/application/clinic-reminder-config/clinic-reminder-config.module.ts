import { Module } from "@nestjs/common";
import { InfrastructureModule } from "@infrastructure/infrastructure.module";
import { ClinicReminderConfigController } from "@application/clinic-reminder-config/controllers/clinic-reminder-config.controller";
import { GetReminderConfigService } from "@application/clinic-reminder-config/services/get-reminder-config.service";
import { UpsertReminderConfigService } from "@application/clinic-reminder-config/services/upsert-reminder-config.service";

@Module({
  imports: [InfrastructureModule],
  controllers: [ClinicReminderConfigController],
  providers: [GetReminderConfigService, UpsertReminderConfigService],
})
export class ClinicReminderConfigModule {}
