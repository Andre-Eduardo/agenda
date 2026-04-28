import {CanActivate, ExecutionContext, ForbiddenException, HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {OnEvent} from '@nestjs/event-emitter';
import {Request} from 'express';
import {AddonPurchasedEvent} from '../../../domain/subscription/events';
import {USAGE_METRIC_KEY} from '../decorators/use-usage-limit.decorator';
import {SubscriptionService, UsageMetric} from '../subscription.service';

@Injectable()
export class UsageLimitGuard implements CanActivate {
    constructor(
        private readonly subscriptionService: SubscriptionService,
        private readonly reflector: Reflector,
    ) {}

    // Invalidate the service-level addon cache immediately on purchase so the
    // next guarded request uses the updated effective limits.
    @OnEvent(AddonPurchasedEvent.type)
    handleAddonPurchased(event: {payload: AddonPurchasedEvent}): void {
        // The cache invalidation is handled inside SubscriptionService.purchaseAddon().
        // This listener exists as an explicit hook for future cross-service invalidation.
        void event;
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const metric = this.reflector.get<UsageMetric | undefined>(USAGE_METRIC_KEY, context.getHandler());

        if (!metric) {
            return true;
        }

        const request = context.switchToHttp().getRequest<Request>();
        const {actor} = request;

        if (!actor.clinicMemberId || !actor.clinicId) {
            throw new ForbiddenException({
                code: 'NO_SUBSCRIPTION',
                message: 'Profissional sem plano ativo',
            });
        }

        const memberId = actor.clinicMemberId.toString();
        const clinicId = actor.clinicId.toString();

        let usage;

        try {
            // getCurrentUsage() resolves effective limits (plan base + active add-ons).
            // Active add-ons are cached for 60 s inside SubscriptionService.getActiveAddons().
            usage = await this.subscriptionService.getCurrentUsage(memberId, clinicId);
        } catch {
            throw new ForbiddenException({
                code: 'NO_SUBSCRIPTION',
                message: 'Profissional sem plano ativo',
            });
        }

        if (usage.subscription.status === 'SUSPENDED') {
            throw new ForbiddenException({
                code: 'SUBSCRIPTION_SUSPENDED',
                message: 'Assinatura suspensa por pagamento pendente.',
            });
        }

        const metricDetail = usage.usage[metric];

        if (metricDetail.remaining !== null && metricDetail.remaining <= 0) {
            const {year, month} = usage.period;
            // First day of next month (ISO string)
            const resetAt = new Date(year, month, 1).toISOString();

            throw new HttpException(
                {
                    code: metricDetail.status === 'NOT_INCLUDED' ? 'FEATURE_NOT_INCLUDED' : 'QUOTA_EXCEEDED',
                    metric,
                    used: metricDetail.used,
                    limit: metricDetail.limit,
                    remaining: 0,
                    resetAt,
                },
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        // Attach usage to request so the interceptor can add X-RateLimit-* headers
        request.usageState = usage;

        return true;
    }
}
