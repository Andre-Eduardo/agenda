/// <reference types="jest-extended" />

import type {MaybeAuthenticatedActor} from './domain/@shared/actor';
import type {ExpressContextActions} from './infrastructure/auth';
import type {CurrentUsageResult} from './application/subscription/subscription.service';

declare global {
    namespace Express {
        interface Request {
            actor: MaybeAuthenticatedActor;
            /** Populated by UsageLimitGuard; read by QuotaHeadersInterceptor to set X-RateLimit-* headers. */
            usageState?: CurrentUsageResult;
        }

        interface Response {
            actions: ExpressContextActions;
        }
    }
}
