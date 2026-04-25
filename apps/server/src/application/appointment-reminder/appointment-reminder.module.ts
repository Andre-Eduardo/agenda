import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {AppointmentReminderController} from './controllers/appointment-reminder.controller';
import {AppointmentReminderListener} from './listeners/appointment-reminder.listener';
import {CancelRemindersService} from './services/cancel-reminders.service';
import {ListPendingRemindersService} from './services/list-pending-reminders.service';
import {ScheduleRemindersService} from './services/schedule-reminders.service';

@Module({
    imports: [InfrastructureModule],
    controllers: [AppointmentReminderController],
    providers: [
        ScheduleRemindersService,
        CancelRemindersService,
        ListPendingRemindersService,
        AppointmentReminderListener,
    ],
})
export class AppointmentReminderModule {}
