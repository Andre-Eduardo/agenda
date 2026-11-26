import {SetMetadata} from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rateLimit';

export type RateLimitRule = {
    /** Bucket name; requests are counted per rule, so two routes never share a counter by accident. */
    name: string;
    /** Requests allowed per window. */
    limit: number;
    /** Window length in seconds. */
    windowSeconds: number;
    /**
     * What identifies the caller: the client IP, or a field of the JSON body (lower-cased),
     * e.g. `username` to slow down attacks on one account spread over many IPs.
     */
    key: 'ip' | {bodyField: string};
};

/**
 * Limits how often a route can be called. Counted by `RateLimitGuard`; over the limit the
 * API answers 429 with a `Retry-After` header.
 */
export const RateLimit = (...rules: RateLimitRule[]) => SetMetadata(RATE_LIMIT_KEY, rules);
