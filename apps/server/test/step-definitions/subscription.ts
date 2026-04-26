import {Given} from '@cucumber/cucumber';
import {randomUUID} from 'crypto';
import type {Context} from '../support/context';
import {PLAN_LIMITS} from '../../src/application/subscription/subscription-plans.config';

/**
 * Sets the member's docsUploaded counter in the current period to the given
 * percentage of their plan limit. Use 100 to trigger the hard block (429).
 * Creates or updates the UsageRecord via Prisma.
 *
 * Example:
 *   Given the member "dr_house" has used 100% of their docs quota this month
 */
Given(
    'the member {string} has used {int}% of their docs quota this month',
    async function (this: Context, memberKey: string, pct: number) {
        const memberId = this.getVariableId('clinicMember', memberKey);
        const clinicId = this.getVariableId('clinic', memberKey);

        const subscription = await this.prisma.professionalSubscription.findUnique({
            where: {memberId},
        });
        if (!subscription) {
            throw new Error(
                `No subscription found for clinicMember "${memberKey}". ` +
                    'Ensure a professional was created before this step.',
            );
        }

        const planCode = subscription.planCode as keyof typeof PLAN_LIMITS;
        const limit = PLAN_LIMITS[planCode]?.limits.docsPerMonth ?? 150;
        const docsUploaded = Math.ceil((pct / 100) * limit);

        const now = new Date();
        const periodYear = now.getFullYear();
        const periodMonth = now.getMonth() + 1;

        await this.prisma.usageRecord.upsert({
            where: {usage_record_member_period_unique: {memberId, periodYear, periodMonth}},
            create: {
                id: randomUUID(),
                clinicId,
                memberId,
                subscriptionId: subscription.id,
                periodYear,
                periodMonth,
                docsUploaded,
                planCodeSnapshot: subscription.planCode,
                createdAt: now,
                updatedAt: now,
            },
            update: {docsUploaded, updatedAt: now},
        });
    },
);
