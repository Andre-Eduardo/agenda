import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {ClinicReminderConfigController} from './controllers/clinic-reminder-config.controller';
import {GetReminderConfigService} from './services/get-reminder-config.service';
import {UpsertReminderConfigService} from './services/upsert-reminder-config.service';

@Module({
    imports: [InfrastructureModule],
    controllers: [ClinicReminderConfigController],
    providers: [GetReminderConfigService, UpsertReminderConfigService],
})
export class ClinicReminderConfigModule {}
