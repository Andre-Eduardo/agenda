import { Module } from "@nestjs/common";
import { InfrastructureModule } from "@infrastructure/infrastructure.module";
import { StubEmailProvider } from "@infrastructure/notification/stub-email.provider";
import { StubSmsProvider } from "@infrastructure/notification/stub-sms.provider";
import { StubWhatsAppProvider } from "@infrastructure/notification/stub-whatsapp.provider";
import { NOTIFICATION_PROVIDERS } from "@infrastructure/notification/notification-provider.token";
import { AppointmentReminderController } from "@application/appointment-reminder/controllers/appointment-reminder.controller";
import { AppointmentReminderListener } from "@application/appointment-reminder/listeners/appointment-reminder.listener";
import { CancelRemindersService } from "@application/appointment-reminder/services/cancel-reminders.service";
import { DispatchRemindersService } from "@application/appointment-reminder/services/dispatch-reminders.service";
import { ListPendingRemindersService } from "@application/appointment-reminder/services/list-pending-reminders.service";
import { ScheduleRemindersService } from "@application/appointment-reminder/services/schedule-reminders.service";
import { ReminderDispatchTask } from "@application/appointment-reminder/tasks/reminder-dispatch.task";

@Module({
  imports: [InfrastructureModule],
  controllers: [AppointmentReminderController],
  providers: [
    ScheduleRemindersService,
    CancelRemindersService,
    ListPendingRemindersService,
    DispatchRemindersService,
    AppointmentReminderListener,
    ReminderDispatchTask,
    StubWhatsAppProvider,
    StubSmsProvider,
    StubEmailProvider,
    {
      provide: NOTIFICATION_PROVIDERS,
      useFactory: (wa: StubWhatsAppProvider, sms: StubSmsProvider, email: StubEmailProvider) => [
        wa,
        sms,
        email,
      ],
      inject: [StubWhatsAppProvider, StubSmsProvider, StubEmailProvider],
    },
  ],
})
export class AppointmentReminderModule {}
