import {inspect} from 'util';
import {Injectable} from '@nestjs/common';
import {SpanStatusCode, trace} from '@opentelemetry/api';
import {ErrorTracker} from '@application/@shared/telemetry';

@Injectable()
export class OtelErrorTracker extends ErrorTracker {
    record(error: unknown): void {
        const span = trace.getActiveSpan();

        if (span === undefined) {
            return;
        }

        span.recordException(error instanceof Error ? error : inspect(error));
        span.setStatus({code: SpanStatusCode.ERROR});
    }
}
