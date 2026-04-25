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

export type MetricStatus = 'OK' | 'WARNING' | 'EXCEEDED' | 'NOT_INCLUDED';

type UsageMetricDetail = {
    used: number;
    limit: number | null;
    percent: number;
    remaining: number | null;
    status: MetricStatus;
};

export type UsageAlert = {
    metric: string;
    type: 'WARNING' | 'EXCEEDED';
    message: string;
};

export type CurrentUsageResult = {
    planCode: PlanCode;
    planName: string;
    period: {year: number; month: number};
    resetAt: string;
    usage: {
        docs: UsageMetricDetail;
        chat: UsageMetricDetail;
        images: UsageMetricDetail;
        storageHotGb: UsageMetricDetail;
    };
    isAnyLimitReached: boolean;
    warningThreshold: number;
    limitsReached: string[];
    alerts: UsageAlert[];
    subscription: {
        status: string;
        currentPeriodStart: string;
        currentPeriodEnd: string;
    };
};

export type ClinicMemberUsageEntry = {
    memberId: string;
    displayName: string;
    planCode: PlanCode;
    usage: CurrentUsageResult;
};

const WARNING_THRESHOLD = 80;

const METRIC_LABELS: Record<string, string> = {
    docs: 'documentos',
    chat: 'mensagens de chat',
    images: 'imagens clínicas',
    storageHotGb: 'armazenamento',
};

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

    private periodResetAt(year: number, month: number): string {
        // First day of the next month (month is 1-based; Date constructor is 0-based → month index = next month)
        return new Date(year, month, 1).toISOString();
    }

    private calcMetric(used: number, limit: number | null): UsageMetricDetail {
        if (limit === null) {
            return {used, limit: null, percent: 0, remaining: null, status: 'OK'};
        }
        if (limit === 0) {
            return {used, limit: 0, percent: 0, remaining: 0, status: 'NOT_INCLUDED'};
        }
        const percent = Math.min(100, Math.round((used / limit) * 100));
        const remaining = Math.max(0, limit - used);
        const status: MetricStatus = remaining === 0 ? 'EXCEEDED' : percent >= WARNING_THRESHOLD ? 'WARNING' : 'OK';
        return {used, limit, percent, remaining, status};
    }

    private buildAlerts(usage: CurrentUsageResult['usage']): UsageAlert[] {
        const alerts: UsageAlert[] = [];
        const metrics = ['docs', 'chat', 'images', 'storageHotGb'] as const;

        for (const metric of metrics) {
            const detail = usage[metric];
            if (detail.status === 'WARNING') {
                alerts.push({
                    metric,
                    type: 'WARNING',
                    message: `Você usou ${detail.percent}% dos ${METRIC_LABELS[metric] ?? metric} do mês.`,
                });
            } else if (detail.status === 'EXCEEDED') {
                alerts.push({
                    metric,
                    type: 'EXCEEDED',
                    message: `Limite de ${METRIC_LABELS[metric] ?? metric} atingido para este mês.`,
                });
            }
        }

        return alerts;
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

        const usage = {docs, chat, images, storageHotGb};

        const limitsReached: string[] = [];
        if (docs.limit !== null && docs.remaining === 0 && docs.status !== 'NOT_INCLUDED') limitsReached.push('docs');
        if (chat.limit !== null && chat.remaining === 0 && chat.status !== 'NOT_INCLUDED') limitsReached.push('chat');
        if (images.limit !== null && images.remaining === 0 && images.status !== 'NOT_INCLUDED') limitsReached.push('images');
        if (storageHotGb.limit !== null && storageHotGb.remaining === 0 && storageHotGb.status !== 'NOT_INCLUDED') limitsReached.push('storageHotGb');

        const alerts = this.buildAlerts(usage);

        return {
            planCode,
            planName: PLAN_LIMITS[planCode].name,
            period: {year, month},
            resetAt: this.periodResetAt(year, month),
            usage,
            isAnyLimitReached: limitsReached.length > 0,
            warningThreshold: WARNING_THRESHOLD,
            limitsReached,
            alerts,
            subscription: {
                status: subscription.status,
                currentPeriodStart: subscription.currentPeriodStart.toISOString(),
                currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
            },
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
     * Returns all professionals' current usage for the given clinic, with display names.
     * Used by the clinic admin/owner view.
     */
    async getClinicUsage(clinicId: string): Promise<ClinicMemberUsageEntry[]> {
        const subscriptions = await this.prisma.professionalSubscription.findMany({
            where: {clinicId, deletedAt: null},
            include: {
                member: {
                    include: {user: true},
                },
            },
        });

        return Promise.all(
            subscriptions.map(async (sub) => ({
                memberId: sub.memberId,
                displayName: sub.member.user.name,
                planCode: toEnum(PlanCodeRecord, sub.planCode),
                usage: await this.getCurrentUsage(sub.memberId, clinicId),
            })),
        );
    }
}
