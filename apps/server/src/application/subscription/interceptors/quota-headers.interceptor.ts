import {CallHandler, ExecutionContext, Injectable, NestInterceptor} from '@nestjs/common';
import {Request, Response} from 'express';
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';

/**
 * Injects X-RateLimit-* headers into responses for endpoints covered by UsageLimitGuard.
 * Applied automatically by @UseUsageLimit — no manual registration needed.
 *
 * Headers added (GitHub/Stripe rate-limit convention):
 *   X-RateLimit-Limit-Docs      — monthly docs limit
 *   X-RateLimit-Remaining-Docs  — docs still available
 *   X-RateLimit-Limit-Chat      — monthly chat limit
 *   X-RateLimit-Remaining-Chat  — chat still available
 *   X-RateLimit-Limit-Images    — monthly images limit
 *   X-RateLimit-Remaining-Images
 *   X-RateLimit-Reset           — Unix timestamp of next monthly reset
 */
@Injectable()
export class QuotaHeadersInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        return next.handle().pipe(
            tap(() => {
                const request = context.switchToHttp().getRequest<Request>();
                const {usageState} = request;

                if (!usageState) return;

                const response = context.switchToHttp().getResponse<Response>();
                const {docs, chat, images} = usageState.usage;
                const resetUnix = Math.floor(new Date(usageState.resetAt).getTime() / 1000);

                if (docs.limit !== null) {
                    response.setHeader('X-RateLimit-Limit-Docs', String(docs.limit));
                    response.setHeader('X-RateLimit-Remaining-Docs', String(docs.remaining ?? 0));
                }

                if (chat.limit !== null) {
                    response.setHeader('X-RateLimit-Limit-Chat', String(chat.limit));
                    response.setHeader('X-RateLimit-Remaining-Chat', String(chat.remaining ?? 0));
                }

                if (images.limit !== null) {
                    response.setHeader('X-RateLimit-Limit-Images', String(images.limit));
                    response.setHeader('X-RateLimit-Remaining-Images', String(images.remaining ?? 0));
                }

                response.setHeader('X-RateLimit-Reset', String(resetUnix));
            }),
        );
    }
}
