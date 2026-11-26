import {Injectable} from '@nestjs/common';
import type {Counter, Histogram, Meter} from '@opentelemetry/api';
import {Metrics, type MetricAttributes} from '@application/@shared/telemetry';

@Injectable()
export class OtelMetrics extends Metrics {
    private readonly counters = new Map<string, Counter>();

    private readonly histograms = new Map<string, Histogram>();

    private readonly gauges = new Set<string>();

    constructor(private readonly meter: Meter) {
        super();
    }

    count(name: string, value = 1, attributes?: MetricAttributes): void {
        let counter = this.counters.get(name);

        if (counter === undefined) {
            counter = this.meter.createCounter(name);
            this.counters.set(name, counter);
        }

        counter.add(value, attributes);
    }

    observe(name: string, value: number, attributes?: MetricAttributes): void {
        let histogram = this.histograms.get(name);

        if (histogram === undefined) {
            histogram = this.meter.createHistogram(name);
            this.histograms.set(name, histogram);
        }

        histogram.record(value, attributes);
    }

    gauge(name: string, read: () => Promise<number> | number): void {
        if (this.gauges.has(name)) {
            return;
        }

        const gauge = this.meter.createObservableGauge(name);

        gauge.addCallback(async (result) => {
            result.observe(await read());
        });

        this.gauges.add(name);
    }
}
