import {inspect} from 'util';
import {Injectable} from '@nestjs/common';
import {SpanStatusCode, type Tracer as OtelApiTracer} from '@opentelemetry/api';
import {Tracer} from '@application/@shared/telemetry';

@Injectable()
export class OtelTracer extends Tracer {
    constructor(private readonly tracer: OtelApiTracer) {
        super();
    }

    trace<T>(name: string, work: () => Promise<T>): Promise<T> {
        return this.tracer.startActiveSpan(name, async (span) => {
            try {
                return await work();
            } catch (error) {
                span.recordException(error instanceof Error ? error : inspect(error));
                span.setStatus({code: SpanStatusCode.ERROR});

                throw error;
            } finally {
                span.end();
            }
        });
    }
}
