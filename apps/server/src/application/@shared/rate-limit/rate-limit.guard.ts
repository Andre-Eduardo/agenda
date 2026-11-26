import {CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {Request, Response} from 'express';
import {RATE_LIMIT_KEY, RateLimitRule} from '@application/@shared/rate-limit/rate-limit.decorator';
import {InMemoryRateLimitStore} from '@application/@shared/rate-limit/rate-limit.store';

/**
 * Global guard that enforces `@RateLimit()` rules. Routes without the decorator pass untouched.
 * Registered before the AuthGuard so brute-force attempts are rejected before any lookup.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly enabled: boolean,
        private readonly store: InMemoryRateLimitStore = new InMemoryRateLimitStore()
    ) {}

    canActivate(context: ExecutionContext): boolean {
        if (!this.enabled || context.getType() !== 'http') return true;

        const rules = this.reflector.get<RateLimitRule[] | undefined>(RATE_LIMIT_KEY, context.getHandler());

        if (rules === undefined || rules.length === 0) return true;

        const request = context.switchToHttp().getRequest<Request>();
        const now = Date.now();

        for (const rule of rules) {
            const identity = this.identify(rule, request);

            if (identity === null) continue;

            const {count, resetAt} = this.store.hit(`${rule.name}:${identity}`, rule.windowSeconds * 1000, now);

            if (count > rule.limit) {
                const retryAfter = Math.max(1, Math.ceil((resetAt - now) / 1000));

                context.switchToHttp().getResponse<Response>().setHeader('Retry-After', String(retryAfter));

                throw new HttpException(
                    {error: 'Too Many Requests', message: `Too many attempts. Try again in ${retryAfter} seconds.`},
                    HttpStatus.TOO_MANY_REQUESTS
                );
            }
        }

        return true;
    }

    private identify(rule: RateLimitRule, request: Request): string | null {
        if (rule.key === 'ip') {
            return request.ip ?? request.socket.remoteAddress ?? 'unknown';
        }

        const {body}: {body: unknown} = request;

        if (typeof body !== 'object' || body === null) return null;

        const value: unknown = Reflect.get(body, rule.key.bodyField);

        return typeof value === 'string' && value.trim() !== '' ? value.trim().toLowerCase() : null;
    }
}
