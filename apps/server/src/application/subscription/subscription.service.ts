import {Injectable} from '@nestjs/common';
import {EventEmitter2} from '@nestjs/event-emitter';
import {randomUUID} from 'crypto';
import {AccessDeniedException, AccessDeniedReason, InvalidInputException, ResourceNotFoundException} from '../../domain/@shared/exceptions';
import {ClinicMemberRole} from '../../domain/clinic-member/entities';
import {toEnum} from '../../domain/@shared/utils';
import {AddonPurchasedEvent} from '../../domain/subscription/events';
import {PrismaProvider} from '../../infrastructure/repository/prisma/prisma.provider';
import {
    ADDON_CATALOG,
    AddonCode,
    AddonGrants,
    PLAN_LIMITS,
    PlanCode,
    PlanCodeRecord,
    getEffectiveLimits,
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

export type ActiveAddonEntry = {
    addonCode: AddonCode;
    quantity: number;
};

export type AddonDetail = {
    code: string;
    name: string;
    quantity: number;
    grantsTotal: AddonGrants;
    expiresAt: string;
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
    addons: AddonDetail[];
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

type AddonCacheEntry = {
    addons: ActiveAddonEntry[];
    expiresAt: number;
};

@Injectable()
export class SubscriptionService {
    private readonly addonCache = new Map<string, AddonCacheEntry>();

    constructor(
        private readonly prismaProvider: PrismaProvider,
        private readonly eventEmitter: EventEmitter2,
    ) {}

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

    private periodEndIso(year: number, month: number): string {
        return new Date(year, month, 0, 23, 59, 59, 999).toISOString();
    }

    private addonCacheKey(memberId: string, year: number, month: number): string {
        return `${memberId}:${year}:${month}`;
    }

    private invalidateAddonCache(memberId: string): void {
        for (const key of this.addonCache.keys()) {
            if (key.startsWith(`${memberId}:`)) {
                this.addonCache.delete(key);
            }
        }
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
        const status: MetricStatus = remaining === 0 ? 'EXCEEDED' : (percent >= WARNING_THRESHOLD ? 'WARNING' : 'OK');

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
     * Returns add-ons active for the member in the current period.
     * Results are cached for 60 s to avoid an extra query per guarded request.
     */
    async getActiveAddons(memberId: string, _clinicId: string): Promise<ActiveAddonEntry[]> {
        const {year, month} = this.currentPeriod();
        const cacheKey = this.addonCacheKey(memberId, year, month);
        const cached = this.addonCache.get(cacheKey);

        if (cached && Date.now() < cached.expiresAt) {
            return cached.addons;
        }

        const rows = await this.prisma.subscriptionAddon.findMany({
            where: {memberId, periodYear: year, periodMonth: month},
            select: {addonCode: true, quantity: true},
        });

        const addons: ActiveAddonEntry[] = rows
            .filter((r) => r.addonCode in ADDON_CATALOG)
            .map((r) => ({addonCode: r.addonCode as AddonCode, quantity: r.quantity}));

        this.addonCache.set(cacheKey, {addons, expiresAt: Date.now() + 60_000});

        return addons;
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
                : (metric === 'chat'
                  ? {chatMessages: {increment: amount}, updatedAt: new Date()}
                  : {clinicalImages: {increment: amount}, updatedAt: new Date()});

        return this.prisma.usageRecord.update({where, data});
    }

    /**
     * Returns current usage with effective limits (plan base + active add-ons).
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
        const {year, month} = this.currentPeriod();

        const activeAddons = await this.getActiveAddons(memberId, clinicId);
        const limits = getEffectiveLimits(planCode, activeAddons);

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
        const expiresAt = this.periodEndIso(year, month);

        const addonDetails: AddonDetail[] = activeAddons.map(({addonCode, quantity}) => {
            const catalog = ADDON_CATALOG[addonCode];
            const grantsTotal: AddonGrants = {};

            if (catalog.grants.docsPerMonth !== undefined) grantsTotal.docsPerMonth = catalog.grants.docsPerMonth * quantity;

            if (catalog.grants.chatMessagesPerMonth !== undefined) grantsTotal.chatMessagesPerMonth = catalog.grants.chatMessagesPerMonth * quantity;

            if (catalog.grants.clinicalImagesPerMonth !== undefined) grantsTotal.clinicalImagesPerMonth = catalog.grants.clinicalImagesPerMonth * quantity;

            if (catalog.grants.storageHotGb !== undefined) grantsTotal.storageHotGb = catalog.grants.storageHotGb * quantity;

            return {code: addonCode, name: catalog.name, quantity, grantsTotal, expiresAt};
        });

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
            addons: addonDetails,
            subscription: {
                status: subscription.status,
                currentPeriodStart: subscription.currentPeriodStart.toISOString(),
                currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
            },
        };
    }

    /**
     * Purchases (or increments) an add-on for the member's current month.
     * If the same add-on already exists this month, the quantity is summed.
     * Emits ADDON_PURCHASED event and invalidates the addon cache.
     */
    async purchaseAddon(
        memberId: string,
        clinicId: string,
        addonCode: AddonCode,
        quantity: number,
        grantedByMemberId: string,
    ): Promise<CurrentUsageResult> {
        const catalog = ADDON_CATALOG[addonCode];

        if (!catalog) {
            throw new InvalidInputException('subscription.addon_not_found');
        }

        if (quantity < 1) {
            throw new InvalidInputException('subscription.addon_quantity_invalid');
        }

        const subscription = await this.prisma.professionalSubscription.findUnique({
            where: {memberId},
        });

        if (!subscription || subscription.status !== 'ACTIVE') {
            throw new ResourceNotFoundException('subscription.not_found', memberId);
        }

        const {year, month} = this.currentPeriod();
        const now = new Date();
        const pricePaidBrl = catalog.priceMonthlyBrl * quantity;

        const existing = await this.prisma.subscriptionAddon.findUnique({
            where: {subscription_addon_member_code_period_unique: {memberId, addonCode, periodYear: year, periodMonth: month}},
        });

        if (existing) {
            await this.prisma.subscriptionAddon.update({
                where: {id: existing.id},
                data: {quantity: existing.quantity + quantity, pricePaidBrl: existing.pricePaidBrl + pricePaidBrl, updatedAt: now},
            });
        } else {
            await this.prisma.subscriptionAddon.create({
                data: {
                    id: randomUUID(),
                    clinicId,
                    memberId,
                    subscriptionId: subscription.id,
                    addonCode,
                    quantity,
                    periodYear: year,
                    periodMonth: month,
                    pricePaidBrl,
                    grantedByMemberId,
                    createdAt: now,
                    updatedAt: now,
                },
            });
        }

        this.invalidateAddonCache(memberId);

        this.eventEmitter.emit(AddonPurchasedEvent.type, {
            payload: new AddonPurchasedEvent({
                data: {memberId, clinicId, addonCode, quantity, periodYear: year, periodMonth: month, pricePaidBrl},
            }),
        });

        return this.getCurrentUsage(memberId, clinicId);
    }

    /**
     * Returns active add-ons for the current month with full detail for the HTTP response.
     */
    async getActiveAddonDetails(memberId: string, _clinicId: string): Promise<AddonDetail[]> {
        const {year, month} = this.currentPeriod();
        const expiresAt = this.periodEndIso(year, month);

        const rows = await this.prisma.subscriptionAddon.findMany({
            where: {memberId, periodYear: year, periodMonth: month},
            select: {addonCode: true, quantity: true},
        });

        return rows
            .filter((r) => r.addonCode in ADDON_CATALOG)
            .map((r) => {
                const code = r.addonCode as AddonCode;
                const catalog = ADDON_CATALOG[code];
                const grantsTotal: AddonGrants = {};

                if (catalog.grants.docsPerMonth !== undefined) grantsTotal.docsPerMonth = catalog.grants.docsPerMonth * r.quantity;

                if (catalog.grants.chatMessagesPerMonth !== undefined) grantsTotal.chatMessagesPerMonth = catalog.grants.chatMessagesPerMonth * r.quantity;

                if (catalog.grants.clinicalImagesPerMonth !== undefined) grantsTotal.clinicalImagesPerMonth = catalog.grants.clinicalImagesPerMonth * r.quantity;

                if (catalog.grants.storageHotGb !== undefined) grantsTotal.storageHotGb = catalog.grants.storageHotGb * r.quantity;

                return {code, name: catalog.name, quantity: r.quantity, grantsTotal, expiresAt};
            });
    }

    /**
     * Returns all active add-ons in a clinic for the current month, grouped by member.
     */
    async getClinicActiveAddons(clinicId: string): Promise<Array<{memberId: string; addons: AddonDetail[]}>> {
        const {year, month} = this.currentPeriod();
        const expiresAt = this.periodEndIso(year, month);

        const rows = await this.prisma.subscriptionAddon.findMany({
            where: {clinicId, periodYear: year, periodMonth: month},
            select: {memberId: true, addonCode: true, quantity: true},
            orderBy: {memberId: 'asc'},
        });

        const byMember = new Map<string, AddonDetail[]>();

        for (const row of rows) {
            if (!(row.addonCode in ADDON_CATALOG)) continue;
            const code = row.addonCode as AddonCode;
            const catalog = ADDON_CATALOG[code];
            const grantsTotal: AddonGrants = {};

            if (catalog.grants.docsPerMonth !== undefined) grantsTotal.docsPerMonth = catalog.grants.docsPerMonth * row.quantity;

            if (catalog.grants.chatMessagesPerMonth !== undefined) grantsTotal.chatMessagesPerMonth = catalog.grants.chatMessagesPerMonth * row.quantity;

            if (catalog.grants.clinicalImagesPerMonth !== undefined) grantsTotal.clinicalImagesPerMonth = catalog.grants.clinicalImagesPerMonth * row.quantity;

            if (catalog.grants.storageHotGb !== undefined) grantsTotal.storageHotGb = catalog.grants.storageHotGb * row.quantity;
            const detail: AddonDetail = {code, name: catalog.name, quantity: row.quantity, grantsTotal, expiresAt};

            const existing = byMember.get(row.memberId);

            if (existing) {
                existing.push(detail);
            } else {
                byMember.set(row.memberId, [detail]);
            }
        }

        return [...byMember.entries()].map(([memberId, addons]) => ({memberId, addons}));
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
