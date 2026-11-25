import {Module} from '@nestjs/common';
import {ClinicReminderConfigController} from '@application/clinic-reminder-config/controllers';
import {
    GetReminderConfigService,
    PreviewReminderMessageService,
    ReminderMessageRenderer,
    UpsertReminderConfigService,
} from '@application/clinic-reminder-config/services';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';

@Module({
    imports: [InfrastructureModule],
    controllers: [ClinicReminderConfigController],
    providers: [
        GetReminderConfigService,
        UpsertReminderConfigService,
        PreviewReminderMessageService,
        ReminderMessageRenderer,
    ],
    exports: [ReminderMessageRenderer],
})
export class ClinicReminderConfigModule {}
