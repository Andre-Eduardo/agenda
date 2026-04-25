import {Injectable} from '@nestjs/common';
import {randomUUID} from 'crypto';
import {AccessDeniedException, AccessDeniedReason, ResourceNotFoundException} from '../../domain/@shared/exceptions';
import {ClinicMemberRole} from '../../domain/clinic-member/entities';
import {toEnum} from '../../domain/@shared/utils';
import {PrismaProvider} from '../../infrastructure/repository/prisma/prisma.provider';
import {
    PLAN_LIMITS,
    PlanCode,
    PlanCodeRecord,
    getPlanLimits,
} from './subscription-plans.config';

export type UsageMetric = 'docs' | 'chat' | 'images';

type UsageMetricDetail = {
    used: number;
    limit: number | null;
    percent: number;
    remaining: number | null;
};

export type CurrentUsageResult = {
    planCode: PlanCode;
    planName: string;
    period: {year: number; month: number};
    usage: {
        docs: UsageMetricDetail;
        chat: UsageMetricDetail;
        images: UsageMetricDetail;
        storageHotGb: UsageMetricDetail;
    };
    isAnyLimitReached: boolean;
    warningThreshold: number;
    limitsReached: string[];
};

const WARNING_THRESHOLD = 80;

@Injectable()
export class SubscriptionService {
    constructor(private readonly prismaProvider: PrismaProvider) {}

    private get prisma() {
        return this.prismaProvider.client;
    }

    private currentPeriod(): {year: number; month: number} {
        const now = new Date();
        return {year: now.getFullYear(), month: now.getMonth() + 1};
    }

    private periodStart(year: number, month: number): Date {
        return new Date(year, month - 1, 1);
    }

    private periodEnd(year: number, month: number): Date {
        // Last millisecond of the last day of the month
        return new Date(year, month, 0, 23, 59, 59, 999);
    }

    private calcMetric(used: number, limit: number | null): UsageMetricDetail {
        if (limit === null) {
            return {used, limit: null, percent: 0, remaining: null};
        }
        const percent = limit === 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));
        return {used, limit, percent, remaining: Math.max(0, limit - used)};
    }

    /**
     * Returns the UsageRecord for the current period, creating it if it does not yet exist.
     * Never throws — always guarantees a record is returned.
     */
    async getOrCreateUsageRecord(memberId: string, clinicId: string) {
        const {year, month} = this.currentPeriod();

        const subscription = await this.prisma.professionalSubscription.findUnique({
            where: {memberId},
        });

        if (!subscription) {
            throw new ResourceNotFoundException('subscription.not_found', memberId);
        }

        const now = new Date();

        return this.prisma.usageRecord.upsert({
            where: {usage_record_member_period_unique: {memberId, periodYear: year, periodMonth: month}},
            create: {
                id: randomUUID(),
                clinicId,
                memberId,
                subscriptionId: subscription.id,
                periodYear: year,
                periodMonth: month,
                planCodeSnapshot: subscription.planCode,
                docsUploaded: 0,
                chatMessages: 0,
                clinicalImages: 0,
                storageHotGbUsed: 0,
                createdAt: now,
                updatedAt: now,
            },
            update: {},
        });
    }

    /**
     * Atomically increments a usage counter for the current period.
     * Handles first-access-of-month record creation transparently.
     */
    async incrementUsage(memberId: string, clinicId: string, metric: UsageMetric, amount = 1) {
        await this.getOrCreateUsageRecord(memberId, clinicId);

        const {year, month} = this.currentPeriod();
        const where = {usage_record_member_period_unique: {memberId, periodYear: year, periodMonth: month}};

        const data =
            metric === 'docs'
                ? {docsUploaded: {increment: amount}, updatedAt: new Date()}
                : metric === 'chat'
                  ? {chatMessages: {increment: amount}, updatedAt: new Date()}
                  : {clinicalImages: {increment: amount}, updatedAt: new Date()};

        return this.prisma.usageRecord.update({where, data});
    }

    /**
     * Returns current usage with limits resolved from the static plan config.
     * Creates the UsageRecord for the current period if it does not exist yet.
     */
    async getCurrentUsage(memberId: string, clinicId: string): Promise<CurrentUsageResult> {
        const subscription = await this.prisma.professionalSubscription.findUnique({
            where: {memberId},
        });

        if (!subscription) {
            throw new ResourceNotFoundException('subscription.not_found', memberId);
        }

        const record = await this.getOrCreateUsageRecord(memberId, clinicId);
        const planCode = toEnum(PlanCodeRecord, subscription.planCode);
        const limits = getPlanLimits(planCode);
        const {year, month} = this.currentPeriod();

        const docs = this.calcMetric(record.docsUploaded, limits.docsPerMonth);
        const chat = this.calcMetric(record.chatMessages, limits.chatMessagesPerMonth);
        const images = this.calcMetric(record.clinicalImages, limits.clinicalImagesPerMonth);
        const storageHotGb = this.calcMetric(record.storageHotGbUsed, limits.storageHotGb);

        const limitsReached: string[] = [];
        if (docs.limit !== null && docs.remaining === 0) limitsReached.push('docs');
        if (chat.limit !== null && chat.remaining === 0) limitsReached.push('chat');
        if (images.limit !== null && images.remaining === 0) limitsReached.push('images');
        if (storageHotGb.limit !== null && storageHotGb.remaining === 0) limitsReached.push('storageHotGb');

        return {
            planCode,
            planName: PLAN_LIMITS[planCode].name,
            period: {year, month},
            usage: {docs, chat, images, storageHotGb},
            isAnyLimitReached: limitsReached.length > 0,
            warningThreshold: WARNING_THRESHOLD,
            limitsReached,
        };
    }

    /**
     * Creates a ProfessionalSubscription for a ClinicMember with role PROFESSIONAL,
     * and seeds an empty UsageRecord for the current period.
     */
    async createSubscription(memberId: string, clinicId: string, planCode: PlanCode) {
        const member = await this.prisma.clinicMember.findUnique({where: {id: memberId}});

        if (!member) {
            throw new ResourceNotFoundException('clinic_member.not_found', memberId);
        }

        if (member.role !== ClinicMemberRole.PROFESSIONAL) {
            throw new AccessDeniedException(
                `Member ${memberId} has role ${member.role}, expected PROFESSIONAL.`,
                AccessDeniedReason.INSUFFICIENT_PERMISSIONS,
            );
        }

        const {year, month} = this.currentPeriod();
        const now = new Date();
        const subscriptionId = randomUUID();

        await this.prisma.professionalSubscription.create({
            data: {
                id: subscriptionId,
                clinicId,
                memberId,
                planCode,
                status: 'ACTIVE',
                currentPeriodStart: this.periodStart(year, month),
                currentPeriodEnd: this.periodEnd(year, month),
                previousPlanCode: null,
                planChangedAt: null,
                createdAt: now,
                updatedAt: now,
            },
        });

        await this.prisma.usageRecord.create({
            data: {
                id: randomUUID(),
                clinicId,
                memberId,
                subscriptionId,
                periodYear: year,
                periodMonth: month,
                planCodeSnapshot: planCode,
                docsUploaded: 0,
                chatMessages: 0,
                clinicalImages: 0,
                storageHotGbUsed: 0,
                createdAt: now,
                updatedAt: now,
            },
        });

        return this.prisma.professionalSubscription.findUniqueOrThrow({where: {memberId}});
    }

    /**
     * Changes the plan on an existing subscription.
     * Usage counters for the current period are preserved — only limits change.
     */
    async changePlan(memberId: string, newPlanCode: PlanCode) {
        const subscription = await this.prisma.professionalSubscription.findUnique({
            where: {memberId},
        });

        if (!subscription) {
            throw new ResourceNotFoundException('subscription.not_found', memberId);
        }

        return this.prisma.professionalSubscription.update({
            where: {memberId},
            data: {
                planCode: newPlanCode,
                previousPlanCode: subscription.planCode,
                planChangedAt: new Date(),
                updatedAt: new Date(),
            },
        });
    }

    /**
     * Returns the active subscription for a member, or throws 404 if none exists.
     */
    async getSubscriptionByMemberId(memberId: string) {
        const subscription = await this.prisma.professionalSubscription.findUnique({
            where: {memberId},
        });

        if (!subscription) {
            throw new ResourceNotFoundException('subscription.not_found', memberId);
        }

        return subscription;
    }

    /**
     * Returns all professionals' current usage for the given clinic.
     * Used by the clinic admin/owner view.
     */
    async getClinicUsage(clinicId: string): Promise<{memberId: string; usage: CurrentUsageResult}[]> {
        const subscriptions = await this.prisma.professionalSubscription.findMany({
            where: {clinicId, deletedAt: null},
        });

        return Promise.all(
            subscriptions.map(async (sub) => ({
                memberId: sub.memberId,
                usage: await this.getCurrentUsage(sub.memberId, clinicId),
            })),
        );
    }
}
