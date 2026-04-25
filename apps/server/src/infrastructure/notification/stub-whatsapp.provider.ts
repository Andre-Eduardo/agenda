import {Injectable, Logger} from '@nestjs/common';
import {ReminderChannel} from '../../domain/appointment-reminder/entities/appointment-reminder.entity';
import {NotificationProvider, type NotificationPayload, type NotificationResult} from '../../domain/notification/ports/notification-provider.port';

@Injectable()
export class StubWhatsAppProvider extends NotificationProvider {
    readonly channel = ReminderChannel.WHATSAPP;

    private readonly logger = new Logger(StubWhatsAppProvider.name);

    async send(payload: NotificationPayload): Promise<NotificationResult> {
        this.logger.log(`[STUB] WhatsApp → ${payload.to}: ${payload.message}`);
        return {success: true, providerId: `stub-wa-${Date.now()}`};
    }
}
