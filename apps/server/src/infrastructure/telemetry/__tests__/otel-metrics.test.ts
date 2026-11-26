import type {Counter, Histogram, Meter, ObservableGauge, ObservableResult} from '@opentelemetry/api';
import {mock} from 'jest-mock-extended';
import {OtelMetrics} from '../otel-metrics';

describe('The OpenTelemetry metrics', () => {
    const meter = mock<Meter>();
    const counter = mock<Counter>();
    const histogram = mock<Histogram>();
    const gauge = mock<ObservableGauge>();

    beforeEach(() => {
        jest.resetAllMocks();
        meter.createCounter.mockReturnValue(counter);
        meter.createHistogram.mockReturnValue(histogram);
        meter.createObservableGauge.mockReturnValue(gauge);
    });

    it('should create each counter once and add to it', () => {
        const metrics = new OtelMetrics(meter);

        metrics.count('notification.reminder.attempt', 1, {channel: 'EMAIL', outcome: 'sent'});
        metrics.count('notification.reminder.attempt');

        expect(meter.createCounter).toHaveBeenCalledTimes(1);
        expect(counter.add).toHaveBeenNthCalledWith(1, 1, {channel: 'EMAIL', outcome: 'sent'});
        expect(counter.add).toHaveBeenNthCalledWith(2, 1, undefined);
    });

    it('should record histogram values', () => {
        new OtelMetrics(meter).observe('notification.provider.send.duration_ms', 120, {channel: 'WHATSAPP'});

        expect(histogram.record).toHaveBeenCalledWith(120, {channel: 'WHATSAPP'});
    });

    it('should register a gauge once and observe its value on export', async () => {
        const metrics = new OtelMetrics(meter);

        metrics.gauge('notification.reminders.overdue', () => Promise.resolve(3));
        metrics.gauge('notification.reminders.overdue', () => 99);

        expect(meter.createObservableGauge).toHaveBeenCalledTimes(1);

        const [callback] = gauge.addCallback.mock.calls[0];
        const result = mock<ObservableResult>();

        await callback(result);

        expect(result.observe).toHaveBeenCalledWith(3);
    });
});
