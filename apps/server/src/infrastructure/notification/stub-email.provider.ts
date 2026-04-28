import {Injectable, Logger} from '@nestjs/common';
import {ReminderChannel} from '../../domain/appointment-reminder/entities/appointment-reminder.entity';
import {NotificationProvider, type NotificationPayload, type NotificationResult} from '../../domain/notification/ports/notification-provider.port';

@Injectable()
export class StubEmailProvider extends NotificationProvider {
    readonly channel = ReminderChannel.EMAIL;

    private readonly logger = new Logger(StubEmailProvider.name);

    async send(payload: NotificationPayload): Promise<NotificationResult> {
        this.logger.log(`[STUB] Email → ${payload.to}: ${payload.message}`);

        return {success: true, providerId: `stub-email-${Date.now()}`};
    }
}
