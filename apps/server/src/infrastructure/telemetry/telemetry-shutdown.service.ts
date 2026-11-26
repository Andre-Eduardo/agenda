import {Injectable, type OnApplicationShutdown} from '@nestjs/common';
import {shutdownTelemetry} from './register';

/**
 * Flushes pending telemetry (spans, metrics, logs) during the application
 * shutdown sequence, after the HTTP server has stopped accepting requests.
 */
@Injectable()
export class TelemetryShutdownService implements OnApplicationShutdown {
    async onApplicationShutdown(): Promise<void> {
        await shutdownTelemetry();
    }
}
