import {randomUUID} from 'node:crypto';
import {OTLPLogExporter} from '@opentelemetry/exporter-logs-otlp-proto';
import {OTLPMetricExporter} from '@opentelemetry/exporter-metrics-otlp-proto';
import {OTLPTraceExporter} from '@opentelemetry/exporter-trace-otlp-proto';
import {ExpressInstrumentation} from '@opentelemetry/instrumentation-express';
import {HttpInstrumentation} from '@opentelemetry/instrumentation-http';
import {NestInstrumentation} from '@opentelemetry/instrumentation-nestjs-core';
import {RuntimeNodeInstrumentation} from '@opentelemetry/instrumentation-runtime-node';
import {SocketIoInstrumentation} from '@opentelemetry/instrumentation-socket.io';
import {UndiciInstrumentation} from '@opentelemetry/instrumentation-undici';
import {WinstonInstrumentation} from '@opentelemetry/instrumentation-winston';
import {resourceFromAttributes} from '@opentelemetry/resources';
import {BatchLogRecordProcessor} from '@opentelemetry/sdk-logs';
import {PeriodicExportingMetricReader} from '@opentelemetry/sdk-metrics';
import {NodeSDK} from '@opentelemetry/sdk-node';
import {ParentBasedSampler, TraceIdRatioBasedSampler} from '@opentelemetry/sdk-trace-base';
import {ATTR_SERVICE_INSTANCE_ID, ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION} from '@opentelemetry/semantic-conventions';
import {PrismaInstrumentation} from '@prisma/instrumentation';
import {config as loadDotenv} from 'dotenv';
import {METRIC_VIEWS} from './metric-views';
import {loadTelemetryEnv} from './telemetry.env';

// This module runs before Nest (and its config module) loads the .env file.
loadDotenv({quiet: true});

const env = loadTelemetryEnv();

let sdk: NodeSDK | undefined;

const APP_VERSION = process.env.APP_VERSION ?? process.env.npm_package_version ?? 'unknown';

// Off by default (OTEL_ENABLED=true turns it on), so local runs and tests never export anything.
if (env.enabled) {
    const baseUrl = env.endpoint.replace(/\/$/, '');

    sdk = new NodeSDK({
        resource: resourceFromAttributes({
            [ATTR_SERVICE_NAME]: env.serviceName,
            [ATTR_SERVICE_VERSION]: APP_VERSION,
            [ATTR_SERVICE_INSTANCE_ID]: randomUUID(),
        }),
        traceExporter: new OTLPTraceExporter({url: `${baseUrl}/v1/traces`}),
        metricReaders: [
            new PeriodicExportingMetricReader({exporter: new OTLPMetricExporter({url: `${baseUrl}/v1/metrics`})}),
        ],
        views: METRIC_VIEWS,
        logRecordProcessors: [
            new BatchLogRecordProcessor({exporter: new OTLPLogExporter({url: `${baseUrl}/v1/logs`})}),
        ],
        sampler: new ParentBasedSampler({root: new TraceIdRatioBasedSampler(env.samplerRatio)}),
        instrumentations: [
            new HttpInstrumentation(),
            // fetch(): Evolution API calls.
            new UndiciInstrumentation(),
            new ExpressInstrumentation(),
            new NestInstrumentation(),
            // Log sending auto-attaches an OTLP transport to every winston logger;
            // log correlation injects trace_id/span_id into each log record.
            new WinstonInstrumentation(),
            new RuntimeNodeInstrumentation(),
            new SocketIoInstrumentation(),
            new PrismaInstrumentation(),
        ],
    });

    sdk.start();
}

export async function shutdownTelemetry(): Promise<void> {
    await sdk?.shutdown();
}
