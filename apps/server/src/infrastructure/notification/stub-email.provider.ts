import {Injectable, Logger} from '@nestjs/common';
import {ReminderChannel} from '@domain/appointment-reminder/entities/appointment-reminder.entity';
import {
    NotificationProvider,
    type NotificationPayload,
    type NotificationResult,
} from '@domain/notification/ports/notification-provider.port';
import {maskDestination} from '@infrastructure/notification/notification-log.util';

/** Development fallback used when no real Email provider is configured: logs instead of sending. */
@Injectable()
export class StubEmailProvider extends NotificationProvider {
    readonly channel = ReminderChannel.EMAIL;

    private readonly logger = new Logger(StubEmailProvider.name);

    send(payload: NotificationPayload): Promise<NotificationResult> {
        this.logger.log(`[STUB] Email → ${maskDestination(payload.to)} (${payload.message.length} chars, not sent)`);

        return Promise.resolve({success: true, providerId: `stub-email-${Date.now()}`});
    }
}
