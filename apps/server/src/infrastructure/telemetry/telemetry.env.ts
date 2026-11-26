import {z} from 'zod';

const emptyAsUndefined = (value: unknown): unknown => (value === '' ? undefined : value);

/**
 * Standalone schema (not tied to the Nest config module) because the OpenTelemetry
 * SDK must be configured before the application — and its config — is loaded.
 * Same variables as plexter (`OTEL_*`), so the same collector setup works for both.
 */
export const telemetryConfig = z.object({
    enabled: z
        .string()
        .optional()
        .transform((value) => value === 'true'),
    serviceName: z.preprocess(emptyAsUndefined, z.string().default('agenda-server')),
    endpoint: z.preprocess(emptyAsUndefined, z.string().url().default('http://localhost:4318')),
    samplerRatio: z.preprocess(emptyAsUndefined, z.coerce.number().min(0).max(1).default(1)),
});

export type TelemetryConfig = z.infer<typeof telemetryConfig>;

export function loadTelemetryEnv(env: NodeJS.ProcessEnv = process.env): TelemetryConfig {
    return telemetryConfig.parse({
        enabled: env.OTEL_ENABLED,
        serviceName: env.OTEL_SERVICE_NAME,
        endpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT,
        samplerRatio: env.OTEL_TRACES_SAMPLER_ARG,
    });
}
