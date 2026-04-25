import {SetMetadata, UseGuards, UseInterceptors, applyDecorators} from '@nestjs/common';
import type {UsageMetric} from '../subscription.service';
import {UsageLimitGuard} from '../guards/usage-limit.guard';
import {QuotaHeadersInterceptor} from '../interceptors/quota-headers.interceptor';

export const USAGE_METRIC_KEY = 'usageMetric';

/**
 * Applies quota enforcement for the given metric.
 *
 * Blocks the request with HTTP 429 when the quota is exhausted.
 * Injects X-RateLimit-* headers into the response on every allowed request.
 *
 * Usage:
 *   @UseUsageLimit('chat')
 *   async sendMessage(...) {}
 */
export const UseUsageLimit = (metric: UsageMetric) =>
    applyDecorators(
        SetMetadata(USAGE_METRIC_KEY, metric),
        UseGuards(UsageLimitGuard),
        UseInterceptors(new QuotaHeadersInterceptor()),
    );
