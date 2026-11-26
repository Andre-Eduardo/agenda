type Bucket = {
    count: number;
    resetAt: number;
};

/**
 * Fixed-window counters kept in memory. Good enough for a single API instance; running several
 * instances multiplies the effective limit by the instance count (move to Redis then).
 */
export class InMemoryRateLimitStore {
    private readonly buckets = new Map<string, Bucket>();

    private lastSweep = 0;

    constructor(private readonly maxKeys = 100_000) {}

    /**
     * Counts one hit and returns the state of the bucket after it.
     */
    hit(key: string, windowMs: number, now = Date.now()): {count: number; resetAt: number} {
        this.sweep(now);

        const current = this.buckets.get(key);

        if (current === undefined || current.resetAt <= now) {
            const bucket = {count: 1, resetAt: now + windowMs};

            this.buckets.set(key, bucket);

            return {...bucket};
        }

        current.count += 1;

        return {...current};
    }

    reset(): void {
        this.buckets.clear();
    }

    private sweep(now: number): void {
        // Drop expired buckets at most once a minute, or right away if the map grew too large.
        if (now - this.lastSweep < 60_000 && this.buckets.size < this.maxKeys) return;

        this.lastSweep = now;

        for (const [key, bucket] of this.buckets) {
            if (bucket.resetAt <= now) this.buckets.delete(key);
        }

        if (this.buckets.size >= this.maxKeys) {
            // Still full of live buckets: forget the oldest ones instead of growing without bound.
            const excess = this.buckets.size - this.maxKeys + 1;
            let removed = 0;

            for (const key of this.buckets.keys()) {
                if (removed >= excess) break;

                this.buckets.delete(key);
                removed += 1;
            }
        }
    }
}
