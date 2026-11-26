import {Injectable, Logger} from '@nestjs/common';
import {ReminderChannel} from '@domain/appointment-reminder/entities/appointment-reminder.entity';
import {
    NotificationProvider,
    type NotificationPayload,
    type NotificationResult,
} from '@domain/notification/ports/notification-provider.port';
import {maskDestination} from '@infrastructure/notification/notification-log.util';

/** Development fallback used when no real WhatsApp provider is configured: logs instead of sending. */
@Injectable()
export class StubWhatsAppProvider extends NotificationProvider {
    readonly channel = ReminderChannel.WHATSAPP;

    private readonly logger = new Logger(StubWhatsAppProvider.name);

    send(payload: NotificationPayload): Promise<NotificationResult> {
        this.logger.log(`[STUB] WhatsApp → ${maskDestination(payload.to)} (${payload.message.length} chars, not sent)`);

        return Promise.resolve({success: true, providerId: `stub-wa-${Date.now()}`});
    }
}
