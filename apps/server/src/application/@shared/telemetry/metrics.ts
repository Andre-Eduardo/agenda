export type MetricAttributes = Record<string, string | number | boolean>;

/**
 * Records business metrics (e.g. reminders sent, webhook events received).
 * Instruments are identified by name and created on first use.
 *
 * Metric names and attribute keys are queried by the dashboards and alerts in `infra/grafana`:
 * renaming one breaks them.
 */
export abstract class Metrics {
    /** Increments a counter, by 1 unless a value is given. */
    abstract count(name: string, value?: number, attributes?: MetricAttributes): void;

    /** Records a value on a histogram (e.g. durations, sizes). */
    abstract observe(name: string, value: number, attributes?: MetricAttributes): void;

    /** Registers an async gauge, read on every metrics export (e.g. queue backlogs). */
    abstract gauge(name: string, read: () => Promise<number> | number): void;
}
