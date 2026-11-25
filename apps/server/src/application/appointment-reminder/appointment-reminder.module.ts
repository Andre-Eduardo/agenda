import {Module} from '@nestjs/common';
import {AppointmentReminderController} from '@application/appointment-reminder/controllers/appointment-reminder.controller';
import {AppointmentReminderListener} from '@application/appointment-reminder/listeners/appointment-reminder.listener';
import {CancelRemindersService} from '@application/appointment-reminder/services/cancel-reminders.service';
import {DispatchRemindersService} from '@application/appointment-reminder/services/dispatch-reminders.service';
import {ListPendingRemindersService} from '@application/appointment-reminder/services/list-pending-reminders.service';
import {ScheduleRemindersService} from '@application/appointment-reminder/services/schedule-reminders.service';
import {ReminderDispatchTask} from '@application/appointment-reminder/tasks/reminder-dispatch.task';
import {ClinicReminderConfigModule} from '@application/clinic-reminder-config/clinic-reminder-config.module';
import {EnvConfigService} from '@infrastructure/config';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';
import {NOTIFICATION_PROVIDERS} from '@infrastructure/notification/notification-provider.token';
import {
    NOTIFICATION_PROVIDER_FACTORY_PROVIDERS,
    notificationProvidersFactory,
} from '@infrastructure/notification/notification-providers.factory';

@Module({
    imports: [InfrastructureModule, ClinicReminderConfigModule],
    controllers: [AppointmentReminderController],
    providers: [
        ScheduleRemindersService,
        CancelRemindersService,
        ListPendingRemindersService,
        DispatchRemindersService,
        AppointmentReminderListener,
        ReminderDispatchTask,
        ...NOTIFICATION_PROVIDER_FACTORY_PROVIDERS,
        {
            provide: NOTIFICATION_PROVIDERS,
            useFactory: notificationProvidersFactory,
            inject: [EnvConfigService, ...NOTIFICATION_PROVIDER_FACTORY_PROVIDERS],
        },
    ],
})
export class AppointmentReminderModule {}
