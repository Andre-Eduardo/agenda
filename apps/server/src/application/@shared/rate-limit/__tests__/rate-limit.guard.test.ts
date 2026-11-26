import type {ExecutionContext} from '@nestjs/common';
import {HttpException} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import type {RateLimitRule} from '../rate-limit.decorator';
import {RATE_LIMIT_KEY} from '../rate-limit.decorator';
import {RateLimitGuard} from '../rate-limit.guard';
import {InMemoryRateLimitStore} from '../rate-limit.store';

const handler = (): undefined => undefined;

function contextFor(request: Record<string, unknown>, setHeader = jest.fn()): ExecutionContext {
    return {
        getType: () => 'http',
        getHandler: () => handler,
        switchToHttp: () => ({
            getRequest: () => request,
            getResponse: () => ({setHeader}),
        }),
    } as unknown as ExecutionContext;
}

describe('A rate limit guard', () => {
    const reflector = new Reflector();

    const ipRule: RateLimitRule = {name: 'test:ip', limit: 2, windowSeconds: 60, key: 'ip'};
    const userRule: RateLimitRule = {name: 'test:user', limit: 1, windowSeconds: 60, key: {bodyField: 'username'}};

    beforeEach(() => {
        jest.useFakeTimers({now: new Date('2026-01-01T00:00:00Z')});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('lets routes without rules through', () => {
        jest.spyOn(reflector, 'get').mockReturnValue(undefined);
        const guard = new RateLimitGuard(reflector, true);

        expect(guard.canActivate(contextFor({ip: '1.1.1.1'}))).toBe(true);
    });

    it('does nothing when disabled', () => {
        const get = jest.spyOn(reflector, 'get').mockReturnValue([ipRule]);
        const guard = new RateLimitGuard(reflector, false);

        for (let i = 0; i < 5; i++) {
            expect(guard.canActivate(contextFor({ip: '1.1.1.1'}))).toBe(true);
        }

        expect(get).not.toHaveBeenCalled();
    });

    it('rejects with 429 and Retry-After once the IP passes the limit', () => {
        const get = jest.spyOn(reflector, 'get').mockReturnValue([ipRule]);
        const guard = new RateLimitGuard(reflector, true, new InMemoryRateLimitStore());
        const setHeader = jest.fn();

        expect(guard.canActivate(contextFor({ip: '1.1.1.1'}))).toBe(true);
        expect(guard.canActivate(contextFor({ip: '1.1.1.1'}))).toBe(true);

        let error: unknown;

        try {
            guard.canActivate(contextFor({ip: '1.1.1.1'}, setHeader));
        } catch (caught) {
            error = caught;
        }

        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(429);
        expect(setHeader).toHaveBeenCalledWith('Retry-After', '60');
        expect(get).toHaveBeenCalledWith(RATE_LIMIT_KEY, expect.any(Function));

        // Another IP has its own counter.
        expect(guard.canActivate(contextFor({ip: '2.2.2.2'}))).toBe(true);
    });

    it('opens again after the window', () => {
        jest.spyOn(reflector, 'get').mockReturnValue([ipRule]);
        const guard = new RateLimitGuard(reflector, true, new InMemoryRateLimitStore());

        guard.canActivate(contextFor({ip: '1.1.1.1'}));
        guard.canActivate(contextFor({ip: '1.1.1.1'}));
        expect(() => guard.canActivate(contextFor({ip: '1.1.1.1'}))).toThrow(HttpException);

        jest.advanceTimersByTime(60_000);

        expect(guard.canActivate(contextFor({ip: '1.1.1.1'}))).toBe(true);
    });

    it('counts a body field case-insensitively across IPs', () => {
        jest.spyOn(reflector, 'get').mockReturnValue([userRule]);
        const guard = new RateLimitGuard(reflector, true, new InMemoryRateLimitStore());

        expect(guard.canActivate(contextFor({ip: '1.1.1.1', body: {username: 'Maria'}}))).toBe(true);
        expect(() => guard.canActivate(contextFor({ip: '2.2.2.2', body: {username: ' maria '}}))).toThrow(
            HttpException
        );
    });

    it('skips a body rule when the field is missing', () => {
        jest.spyOn(reflector, 'get').mockReturnValue([userRule]);
        const guard = new RateLimitGuard(reflector, true, new InMemoryRateLimitStore());

        for (let i = 0; i < 3; i++) {
            expect(guard.canActivate(contextFor({ip: '1.1.1.1', body: {}}))).toBe(true);
            expect(guard.canActivate(contextFor({ip: '1.1.1.1', body: null}))).toBe(true);
        }
    });
});

describe('An in-memory rate limit store', () => {
    it('drops the oldest keys instead of growing without bound', () => {
        const store = new InMemoryRateLimitStore(2);

        store.hit('a', 60_000, 0);
        store.hit('b', 60_000, 0);
        store.hit('c', 60_000, 0);

        // "a" was evicted, so it starts a fresh window.
        expect(store.hit('a', 60_000, 1).count).toBe(1);
    });

    it('can be reset', () => {
        const store = new InMemoryRateLimitStore();

        store.hit('a', 60_000, 0);
        store.reset();

        expect(store.hit('a', 60_000, 0).count).toBe(1);
    });
});
