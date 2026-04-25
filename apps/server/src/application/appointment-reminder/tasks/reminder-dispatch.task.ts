import {Injectable, Logger} from '@nestjs/common';
import {Cron} from '@nestjs/schedule';
import {ClinicRepository} from '../../../domain/clinic/clinic.repository';
import {DispatchRemindersService} from '../services/dispatch-reminders.service';

@Injectable()
export class ReminderDispatchTask {
    private readonly logger = new Logger(ReminderDispatchTask.name);

    constructor(
        private readonly dispatchRemindersService: DispatchRemindersService,
        private readonly clinicRepository: ClinicRepository,
    ) {}

    @Cron('*/5 * * * *')
    async run(): Promise<void> {
        this.logger.log('Running reminder dispatch...');
        const clinics = await this.clinicRepository.findAllActive();

        for (const clinic of clinics) {
            try {
                await this.dispatchRemindersService.dispatchDue(clinic.id);
            } catch (error) {
                this.logger.error(`Failed to dispatch reminders for clinic ${clinic.id.toString()}`, error);
            }
        }
    }
}
