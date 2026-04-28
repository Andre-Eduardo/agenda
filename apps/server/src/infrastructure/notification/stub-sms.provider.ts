import {Injectable, Logger} from '@nestjs/common';
import {ReminderChannel} from '../../domain/appointment-reminder/entities/appointment-reminder.entity';
import {NotificationProvider, type NotificationPayload, type NotificationResult} from '../../domain/notification/ports/notification-provider.port';

@Injectable()
export class StubSmsProvider extends NotificationProvider {
    readonly channel = ReminderChannel.SMS;

    private readonly logger = new Logger(StubSmsProvider.name);

    async send(payload: NotificationPayload): Promise<NotificationResult> {
        this.logger.log(`[STUB] SMS → ${payload.to}: ${payload.message}`);

        return {success: true, providerId: `stub-sms-${Date.now()}`};
    }
}
