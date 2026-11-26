/**
 * Runs work inside a named span. Used to give background work (scheduled jobs,
 * event handlers) a root span, so the DB/HTTP spans it produces are grouped
 * under a readable trace instead of appearing parentless.
 */
export abstract class Tracer {
    abstract trace<T>(name: string, work: () => Promise<T>): Promise<T>;
}
