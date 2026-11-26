/**
 * Records unexpected errors on the telemetry backend so they can be
 * inspected alongside the request trace that produced them.
 */
export abstract class ErrorTracker {
    abstract record(error: unknown): void;
}
