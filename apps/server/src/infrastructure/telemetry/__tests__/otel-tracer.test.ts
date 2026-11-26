import {type Span, SpanStatusCode, type Tracer} from '@opentelemetry/api';
import {mock} from 'jest-mock-extended';
import {OtelTracer} from '../otel-tracer';

describe('The OpenTelemetry tracer', () => {
    const span = mock<Span>();
    const tracer = mock<Tracer>();

    beforeEach(() => {
        jest.resetAllMocks();
        // startActiveSpan has several overloads; the tracer only uses (name, fn).
        tracer.startActiveSpan.mockImplementation(((_name: string, fn: (span: Span) => unknown) =>
            fn(span)) as unknown as Tracer['startActiveSpan']);
    });

    it('should run the work in a named span and end it', async () => {
        await expect(
            new OtelTracer(tracer).trace('schedule.reminder-dispatch', () => Promise.resolve(42))
        ).resolves.toBe(42);

        expect(tracer.startActiveSpan).toHaveBeenCalledWith('schedule.reminder-dispatch', expect.any(Function));
        expect(span.end).toHaveBeenCalled();
    });

    it('should mark the span as failed and rethrow', async () => {
        const error = new Error('db down');

        await expect(new OtelTracer(tracer).trace('job', () => Promise.reject(error))).rejects.toBe(error);

        expect(span.recordException).toHaveBeenCalledWith(error);
        expect(span.setStatus).toHaveBeenCalledWith({code: SpanStatusCode.ERROR});
        expect(span.end).toHaveBeenCalled();
    });
});
