import {Injectable, Logger, type OnModuleInit} from '@nestjs/common';
import {Cron} from '@nestjs/schedule';
import {Metrics, NotificationMetric, Tracer} from '@application/@shared/telemetry';
import {DispatchRemindersService} from '@application/appointment-reminder/services/dispatch-reminders.service';
import {AppointmentReminderRepository} from '@domain/appointment-reminder/appointment-reminder.repository';
import {ClinicRepository} from '@domain/clinic/clinic.repository';

/** A pending reminder this late means the dispatch job is not running (it runs every 5 minutes). */
export const OVERDUE_AFTER_MS = 15 * 60 * 1000;

@Injectable()
export class ReminderDispatchTask implements OnModuleInit {
    private readonly logger = new Logger(ReminderDispatchTask.name);

    constructor(
        private readonly dispatchRemindersService: DispatchRemindersService,
        private readonly clinicRepository: ClinicRepository,
        private readonly reminderRepository: AppointmentReminderRepository,
        private readonly metrics: Metrics,
        private readonly tracer: Tracer
    ) {}

    onModuleInit(): void {
        this.metrics.gauge(NotificationMetric.OVERDUE, () =>
            this.reminderRepository.countPendingScheduledBefore(new Date(Date.now() - OVERDUE_AFTER_MS))
        );
    }

    @Cron('*/5 * * * *')
    async run(): Promise<void> {
        await this.tracer.trace('schedule.reminder-dispatch', async () => {
            this.logger.log('Running reminder dispatch...');
            const clinics = await this.clinicRepository.findAllActive();

            for (const clinic of clinics) {
                try {
                    await this.dispatchRemindersService.dispatchDue(clinic.id);
                } catch (error) {
                    this.logger.error(`Failed to dispatch reminders for clinic ${clinic.id.toString()}`, error);
                }
            }
        });
    }
}
