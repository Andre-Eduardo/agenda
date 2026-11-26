import {loadTelemetryEnv} from '../telemetry.env';

describe('The telemetry environment', () => {
    it('should be off by default, pointing at a local collector', () => {
        expect(loadTelemetryEnv({})).toEqual({
            enabled: false,
            serviceName: 'agenda-server',
            endpoint: 'http://localhost:4318',
            samplerRatio: 1,
        });
    });

    it('should read the standard OTEL variables', () => {
        expect(
            loadTelemetryEnv({
                OTEL_ENABLED: 'true',
                OTEL_SERVICE_NAME: 'agenda-api',
                OTEL_EXPORTER_OTLP_ENDPOINT: 'https://otlp-gateway.grafana.net/otlp',
                OTEL_TRACES_SAMPLER_ARG: '0.25',
            })
        ).toEqual({
            enabled: true,
            serviceName: 'agenda-api',
            endpoint: 'https://otlp-gateway.grafana.net/otlp',
            samplerRatio: 0.25,
        });
    });

    it('should treat empty variables as unset', () => {
        expect(loadTelemetryEnv({OTEL_EXPORTER_OTLP_ENDPOINT: '', OTEL_SERVICE_NAME: ''})).toMatchObject({
            endpoint: 'http://localhost:4318',
            serviceName: 'agenda-server',
        });
    });

    it('should refuse an invalid sampler ratio', () => {
        expect(() => loadTelemetryEnv({OTEL_TRACES_SAMPLER_ARG: '2'})).toThrow();
    });
});
