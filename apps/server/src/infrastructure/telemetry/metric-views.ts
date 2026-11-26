import {AggregationType, createAllowListAttributesProcessor, type ViewOptions} from '@opentelemetry/sdk-metrics';

// Each bucket is one billed series on Grafana Cloud. Keep 1000 ms: it is the p95 alert threshold.
// The allow-lists must cover every label that infra/grafana dashboards and alerts group or filter by.
const HTTP_DURATION_BUCKETS_MS = [25, 50, 100, 250, 500, 1000, 2500, 5000, 10_000];

export const METRIC_VIEWS: ViewOptions[] = [
    {
        instrumentName: 'http.server.duration',
        aggregation: {
            type: AggregationType.EXPLICIT_BUCKET_HISTOGRAM,
            options: {boundaries: HTTP_DURATION_BUCKETS_MS},
        },
        attributesProcessors: [createAllowListAttributesProcessor(['http.method', 'http.route', 'http.status_code'])],
    },
    {
        instrumentName: 'http.client.duration',
        aggregation: {
            type: AggregationType.EXPLICIT_BUCKET_HISTOGRAM,
            options: {boundaries: HTTP_DURATION_BUCKETS_MS},
        },
        attributesProcessors: [
            createAllowListAttributesProcessor(['http.method', 'http.status_code', 'net.peer.name']),
        ],
    },
    {
        instrumentName: 'notification.provider.send.duration_ms',
        aggregation: {
            type: AggregationType.EXPLICIT_BUCKET_HISTOGRAM,
            options: {boundaries: HTTP_DURATION_BUCKETS_MS},
        },
    },
];
