import {Injectable, Logger, UnauthorizedException} from '@nestjs/common';
import {Metrics, NotificationMetric, type WebhookResult} from '@application/@shared/telemetry';
import {
    TrackReminderDeliveryService,
    type ReminderDeliveryUpdate,
} from '@application/appointment-reminder/services/track-reminder-delivery.service';
import {parseSesEvent, type SesDeliveryEvent} from '@application/notification-webhook/parsers/ses-event.parser';
import {AppointmentReminderRepository} from '@domain/appointment-reminder/appointment-reminder.repository';
import {ReminderChannel, ReminderEventSource, ReminderEventType} from '@domain/appointment-reminder/entities';
import {SnsMessageVerifier, snsMessageSchema, type SnsMessage} from '@infrastructure/aws/sns-message-verifier';
import {EnvConfigService} from '@infrastructure/config';

const EVENT_TYPE: Record<SesDeliveryEvent['type'], ReminderDeliveryUpdate['type']> = {
    DELIVERED: ReminderEventType.DELIVERED,
    READ: ReminderEventType.READ,
    DELIVERY_FAILED: ReminderEventType.DELIVERY_FAILED,
    COMPLAINED: ReminderEventType.COMPLAINED,
};

/**
 * Delivery, bounce, complaint and open events of reminder e-mails: SES → SNS topic → this webhook.
 * Accepted only with a valid SNS signature from the topic in `MAIL_SES_EVENTS_TOPIC_ARN`.
 */
@Injectable()
export class ReceiveSesWebhookService {
    private readonly logger = new Logger(ReceiveSesWebhookService.name);

    constructor(
        private readonly config: EnvConfigService,
        private readonly verifier: SnsMessageVerifier,
        private readonly reminderRepository: AppointmentReminderRepository,
        private readonly tracker: TrackReminderDeliveryService,
        private readonly metrics: Metrics
    ) {}

    async receive(body: unknown, now: Date = new Date()): Promise<void> {
        const message = await this.authenticate(body);

        if (message.Type === 'SubscriptionConfirmation') {
            await this.verifier.confirmSubscription(message);
            this.logger.log(`Confirmed the SNS subscription to ${message.TopicArn}`);
            this.count('applied');

            return;
        }

        if (message.Type !== 'Notification') {
            this.count('ignored');

            return;
        }

        const event = parseSesEvent(message.Message, now);

        if (event === null) {
            this.count('ignored');

            return;
        }

        const reminder = await this.reminderRepository.findByProviderMessageId(
            null,
            ReminderChannel.EMAIL,
            event.sesMessageId
        );

        if (reminder === null) {
            this.count('unmatched');

            return;
        }

        const result = await this.tracker.apply(reminder, {
            type: EVENT_TYPE[event.type],
            source: ReminderEventSource.SES,
            // The SNS message id is unique per notification and stays the same on SNS retries.
            externalId: message.MessageId,
            occurredAt: event.occurredAt,
            detail: event.detail,
        });

        this.count(result);
    }

    private async authenticate(body: unknown): Promise<SnsMessage> {
        const topicArn = this.config.mail.eventsTopicArn;
        const parsed = snsMessageSchema.safeParse(typeof body === 'string' ? safeJson(body) : body);

        if (!topicArn || !parsed.success || parsed.data.TopicArn !== topicArn) {
            this.count(parsed.success ? 'unauthorized' : 'invalid');

            throw new UnauthorizedException();
        }

        if (!(await this.verifier.verify(parsed.data))) {
            this.count('unauthorized');

            throw new UnauthorizedException();
        }

        return parsed.data;
    }

    private count(result: WebhookResult): void {
        this.metrics.count(NotificationMetric.WEBHOOK, 1, {source: 'ses', result});
    }
}

function safeJson(value: string): unknown {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}
