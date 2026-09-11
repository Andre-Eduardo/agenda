import {Injectable, Logger} from '@nestjs/common';
import {Cron, CronExpression} from '@nestjs/schedule';
import {PatientSubscriptionRepository} from '@domain/patient-subscription/patient-subscription.repository';

@Injectable()
export class RenewPatientSubscriptionsJob {
    private readonly logger = new Logger(RenewPatientSubscriptionsJob.name);

    constructor(private readonly subscriptionRepository: PatientSubscriptionRepository) {}

    @Cron(CronExpression.EVERY_DAY_AT_1AM)
    async handle(): Promise<void> {
        const now = new Date();
        const renewable = await this.subscriptionRepository.findRenewable(now);

        for (const subscription of renewable) {
            const nextPeriodStart = subscription.currentPeriodEnd;
            const nextPeriodEnd = new Date(nextPeriodStart);

            nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);

            subscription.renewPeriod(nextPeriodStart, nextPeriodEnd);
            await this.subscriptionRepository.save(subscription);
        }

        if (renewable.length > 0) {
            this.logger.log(`Renewed ${renewable.length} patient subscriptions`);
        }
    }
}
