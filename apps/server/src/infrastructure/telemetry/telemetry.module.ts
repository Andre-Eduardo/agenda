import {Global, Module} from '@nestjs/common';
import {metrics, trace} from '@opentelemetry/api';
import {ErrorTracker, Metrics, Tracer} from '@application/@shared/telemetry';
import {OtelErrorTracker} from './otel-error-tracker';
import {OtelMetrics} from './otel-metrics';
import {OtelTracer} from './otel-tracer';
import {TelemetryShutdownService} from './telemetry-shutdown.service';

const INSTRUMENTATION_SCOPE = 'agenda-server';

/**
 * Global so any module can inject `Metrics`, `Tracer` and `ErrorTracker`. When telemetry is off
 * (`OTEL_ENABLED` unset) the OpenTelemetry API falls back to no-op meters and tracers.
 */
@Global()
@Module({
    providers: [
        {provide: ErrorTracker, useClass: OtelErrorTracker},
        {provide: Metrics, useFactory: () => new OtelMetrics(metrics.getMeter(INSTRUMENTATION_SCOPE))},
        {provide: Tracer, useFactory: () => new OtelTracer(trace.getTracer(INSTRUMENTATION_SCOPE))},
        TelemetryShutdownService,
    ],
    exports: [ErrorTracker, Metrics, Tracer],
})
export class TelemetryModule {}
