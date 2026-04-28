import {Injectable, Logger} from '@nestjs/common';
import {AccessDeniedException, AccessDeniedReason, InvalidInputException, ResourceNotFoundException} from '../../domain/@shared/exceptions';
import {PrismaProvider} from '../../infrastructure/repository/prisma/prisma.provider';
import {PLAN_LIMITS, PlanCode, PlanCodeRecord} from '../subscription/subscription-plans.config';
import {toEnum} from '../../domain/@shared/utils';
import {usdToBrl} from '../../ai/pricing/ai-pricing.config';

export type ModelBreakdownEntry = {
    modelId: string;
    messages: number;
    costUsd: number;
};

export type MemberAiCostResult = {
    totalCostUsd: number;
    totalCostBrl: number;
    interactionCount: number;
    avgCostPerMessageUsd: number;
    modelBreakdown: ModelBreakdownEntry[];
};

export type MemberUsageCostResult = {
    docs: {count: number; unitCostBrl: number; totalCostBrl: number};
    chat: {messages: number; totalCostUsd: number; totalCostBrl: number};
    images: {count: number; unitCostBrl: number; totalCostBrl: number};
};

export type MemberRevenueResult = {
    planRevenueBrl: number;
};

export type MemberMarginResult = {
    totalCostBrl: number;
    revenueBrl: number;
    grossMarginBrl: number;
    grossMarginPercent: number;
};

export type MemberCostReport = {
    member: {id: string; displayName: string; planCode: PlanCode; planPriceBrl: number};
    period: {year: number; month: number};
    usage: MemberUsageCostResult;
    aiCost: MemberAiCostResult;
    revenue: MemberRevenueResult;
    margin: MemberMarginResult;
};

export type ClinicCostReportSummary = {
    totalMembers: number;
    totalRevenueBrl: number;
    totalAiCostUsd: number;
    totalAiCostBrl: number;
    avgMarginPercent: number;
    mostExpensiveMember: {memberId: string; displayName: string; aiCostUsd: number} | null;
    mostActiveByChat: {memberId: string; displayName: string; messages: number} | null;
};

export type ClinicCostReport = {
    clinic: {id: string; name: string};
    period: {year: number; month: number};
    members: MemberCostReport[];
    summary: ClinicCostReportSummary;
};

@Injectable()
export class BillingReportService {
    private readonly logger = new Logger(BillingReportService.name);

    constructor(private readonly prismaProvider: PrismaProvider) {}

    private get prisma() {
        return this.prismaProvider.client;
    }

    private periodBounds(year: number, month: number): {from: Date; to: Date} {
        return {
            from: new Date(year, month - 1, 1),
            to: new Date(year, month, 0, 23, 59, 59, 999),
        };
    }

    private validatePeriod(year: number, month: number): void {
        if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
            throw new InvalidInputException('billing.invalid_period');
        }

        const now = new Date();
        const requestedStart = new Date(year, month - 1, 1);
        const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);

        if (requestedStart > currentStart) {
            throw new InvalidInputException('billing.future_period');
        }
    }

    async getMemberCostReport(
        memberId: string,
        clinicId: string,
        year: number,
        month: number,
    ): Promise<MemberCostReport> {
        this.validatePeriod(year, month);

        const member = await this.prisma.clinicMember.findUnique({
            where: {id: memberId},
            include: {user: true},
        });

        if (!member || member.clinicId !== clinicId) {
            throw new ResourceNotFoundException('clinic_member.not_found', memberId);
        }

        const subscription = await this.prisma.professionalSubscription.findUnique({
            where: {memberId},
        });

        if (!subscription) {
            throw new ResourceNotFoundException('subscription.not_found', memberId);
        }

        const planCode = toEnum(PlanCodeRecord, subscription.planCode);
        const planConfig = PLAN_LIMITS[planCode];

        const usageRecord = await this.prisma.usageRecord.findUnique({
            where: {usage_record_member_period_unique: {memberId, periodYear: year, periodMonth: month}},
        });

        const {from, to} = this.periodBounds(year, month);

        const interactionLogs = await this.prisma.clinicalChatInteractionLog.findMany({
            where: {
                session: {memberId},
                clinicId,
                createdAt: {gte: from, lte: to},
                status: 'COMPLETED',
            },
            select: {modelId: true, costUsd: true},
        });

        // Aggregate AI costs by model
        const byModel = new Map<string, {messages: number; costUsd: number}>();
        let totalCostUsd = 0;

        for (const log of interactionLogs) {
            if (!log.modelId) continue;
            const entry = byModel.get(log.modelId) ?? {messages: 0, costUsd: 0};

            entry.messages += 1;
            entry.costUsd += log.costUsd ?? 0;
            byModel.set(log.modelId, entry);
            totalCostUsd += log.costUsd ?? 0;
        }

        totalCostUsd = Number(totalCostUsd.toFixed(8));
        const totalCostBrl = usdToBrl(totalCostUsd);
        const interactionCount = interactionLogs.length;
        const avgCostPerMessageUsd = interactionCount > 0
            ? Number((totalCostUsd / interactionCount).toFixed(8))
            : 0;

        const modelBreakdown: ModelBreakdownEntry[] = [...byModel.entries()].map(
            ([modelId, data]) => ({
                modelId,
                messages: data.messages,
                costUsd: Number(data.costUsd.toFixed(8)),
            }),
        );

        const chatMessages = usageRecord?.chatMessages ?? 0;
        const docsUploaded = usageRecord?.docsUploaded ?? 0;
        const clinicalImages = usageRecord?.clinicalImages ?? 0;

        const planRevenueBrl = planConfig.priceMonthlyBrl;
        const totalMarginCostBrl = totalCostBrl;

        return {
            member: {
                id: memberId,
                displayName: member.user.name,
                planCode,
                planPriceBrl: planConfig.priceMonthlyBrl,
            },
            period: {year, month},
            usage: {
                docs: {count: docsUploaded, unitCostBrl: 0, totalCostBrl: 0},
                chat: {messages: chatMessages, totalCostUsd, totalCostBrl},
                images: {count: clinicalImages, unitCostBrl: 0, totalCostBrl: 0},
            },
            aiCost: {
                totalCostUsd,
                totalCostBrl,
                interactionCount,
                avgCostPerMessageUsd,
                modelBreakdown,
            },
            revenue: {planRevenueBrl},
            margin: {
                totalCostBrl: totalMarginCostBrl,
                revenueBrl: planRevenueBrl,
                grossMarginBrl: Number((planRevenueBrl - totalMarginCostBrl).toFixed(4)),
                grossMarginPercent: planRevenueBrl > 0
                    ? Number(((planRevenueBrl - totalMarginCostBrl) / planRevenueBrl * 100).toFixed(2))
                    : 0,
            },
        };
    }

    async getClinicCostReport(clinicId: string, year: number, month: number): Promise<ClinicCostReport> {
        this.validatePeriod(year, month);

        const clinic = await this.prisma.clinic.findUnique({where: {id: clinicId}});

        if (!clinic) {
            throw new ResourceNotFoundException('clinic.not_found', clinicId);
        }

        const subscriptions = await this.prisma.professionalSubscription.findMany({
            where: {clinicId},
        });

        const memberReports = await Promise.all(
            subscriptions.map(async (sub) => {
                try {
                    return await this.getMemberCostReport(sub.memberId, clinicId, year, month);
                } catch (error: unknown) {
                    this.logger.warn(
                        `[billing] Skipping member ${sub.memberId} in clinic report: ${error instanceof Error ? error.message : String(error)}`,
                    );

                    return null;
                }
            }),
        );

        const members = memberReports.filter((r): r is MemberCostReport => r !== null);

        const totalRevenueBrl = members.reduce((sum, m) => sum + m.revenue.planRevenueBrl, 0);
        const totalAiCostUsd = Number(
            members.reduce((sum, m) => sum + m.aiCost.totalCostUsd, 0).toFixed(8),
        );
        const totalAiCostBrl = usdToBrl(totalAiCostUsd);
        const avgMarginPercent =
            members.length > 0
                ? Number(
                      (members.reduce((sum, m) => sum + m.margin.grossMarginPercent, 0) / members.length).toFixed(2),
                  )
                : 0;

        const mostExpensiveMember =
            members.length > 0
                ? members.reduce((a, b) => (a.aiCost.totalCostUsd >= b.aiCost.totalCostUsd ? a : b))
                : null;

        const mostActiveByChat =
            members.length > 0
                ? members.reduce((a, b) => (a.aiCost.interactionCount >= b.aiCost.interactionCount ? a : b))
                : null;

        return {
            clinic: {id: clinicId, name: clinic.name},
            period: {year, month},
            members,
            summary: {
                totalMembers: members.length,
                totalRevenueBrl,
                totalAiCostUsd,
                totalAiCostBrl,
                avgMarginPercent,
                mostExpensiveMember: mostExpensiveMember
                    ? {
                          memberId: mostExpensiveMember.member.id,
                          displayName: mostExpensiveMember.member.displayName,
                          aiCostUsd: mostExpensiveMember.aiCost.totalCostUsd,
                      }
                    : null,
                mostActiveByChat: mostActiveByChat
                    ? {
                          memberId: mostActiveByChat.member.id,
                          displayName: mostActiveByChat.member.displayName,
                          messages: mostActiveByChat.aiCost.interactionCount,
                      }
                    : null,
            },
        };
    }

    validateSelfOrThrow(actorMemberId: string, targetMemberId: string): void {
        if (actorMemberId !== targetMemberId) {
            throw new AccessDeniedException(
                `Member ${actorMemberId} cannot view billing report for ${targetMemberId}.`,
                AccessDeniedReason.INSUFFICIENT_PERMISSIONS,
            );
        }
    }
}
