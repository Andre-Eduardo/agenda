import {Injectable, Logger, UnauthorizedException} from '@nestjs/common';
import {Metrics, NotificationMetric, type WebhookResult} from '@application/@shared/telemetry';
import {
    TrackReminderDeliveryService,
    type ReminderDeliveryUpdate,
} from '@application/appointment-reminder/services/track-reminder-delivery.service';
import {
    type EvolutionReply,
    type EvolutionStatusUpdate,
    parseEvolutionWebhook,
    whatsAppNumberVariants,
} from '@application/notification-webhook/parsers/evolution-webhook.parser';
import {RecordPatientOptOutService} from '@application/patient-communication-preference/services/record-patient-opt-out.service';
import {AppointmentReminderRepository} from '@domain/appointment-reminder/appointment-reminder.repository';
import {ReminderChannel, ReminderEventSource, ReminderEventType} from '@domain/appointment-reminder/entities';
import type {ClinicId} from '@domain/clinic/entities';
import {CommunicationPreferenceSource} from '@domain/patient-communication-preference/entities';
import {isOptOutReply} from '@domain/patient-communication-preference/opt-out-keywords';
import {EnvConfigService} from '@infrastructure/config';
import {verifyEvolutionWebhookToken} from '@infrastructure/whatsapp/evolution-webhook-token';

/** A reply that does not quote the reminder is attributed to the latest one sent in this window. */
export const REPLY_ATTRIBUTION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const STATUS_EVENT: Record<EvolutionStatusUpdate['status'], ReminderDeliveryUpdate['type']> = {
    DELIVERED: ReminderEventType.DELIVERED,
    READ: ReminderEventType.READ,
    ERROR: ReminderEventType.DELIVERY_FAILED,
};

export type ReceiveEvolutionWebhook = {
    clinicId: ClinicId;
    token: string | undefined;
    body: unknown;
};

/** Delivery acks and patient replies for WhatsApp reminders (Evolution API webhook). */
@Injectable()
export class ReceiveEvolutionWebhookService {
    private readonly logger = new Logger(ReceiveEvolutionWebhookService.name);

    constructor(
        private readonly config: EnvConfigService,
        private readonly reminderRepository: AppointmentReminderRepository,
        private readonly tracker: TrackReminderDeliveryService,
        private readonly metrics: Metrics,
        private readonly optOut: RecordPatientOptOutService
    ) {}

    async receive({clinicId, token, body}: ReceiveEvolutionWebhook, now: Date = new Date()): Promise<void> {
        const secret = this.config.evolutionApi.webhookSecret;

        if (!secret || !verifyEvolutionWebhookToken(secret, clinicId, token)) {
            this.count('unauthorized');

            throw new UnauthorizedException();
        }

        const items = parseEvolutionWebhook(body, now);

        if (items.length === 0) {
            this.count('ignored');

            return;
        }

        for (const item of items) {
            const result =
                item.kind === 'status'
                    ? await this.applyStatus(clinicId, item)
                    : await this.applyReply(clinicId, item, now);

            this.count(result);
        }
    }

    private async applyStatus(clinicId: ClinicId, update: EvolutionStatusUpdate): Promise<WebhookResult> {
        const reminder = await this.reminderRepository.findByProviderMessageId(
            clinicId,
            ReminderChannel.WHATSAPP,
            update.messageId
        );

        // Most acks are for messages that are not reminders (e.g. sent from the phone).
        if (reminder === null) return 'unmatched';

        return this.tracker.apply(reminder, {
            type: STATUS_EVENT[update.status],
            source: ReminderEventSource.EVOLUTION,
            externalId: `${update.messageId}:${update.status}`,
            occurredAt: update.occurredAt,
            detail: update.status === 'ERROR' ? 'WhatsApp reported an error delivering the message' : null,
        });
    }

    private async applyReply(clinicId: ClinicId, reply: EvolutionReply, now: Date): Promise<WebhookResult> {
        const quoted =
            reply.quotedMessageId === null
                ? null
                : await this.reminderRepository.findByProviderMessageId(
                      clinicId,
                      ReminderChannel.WHATSAPP,
                      reply.quotedMessageId
                  );
        const reminder =
            quoted ??
            (await this.reminderRepository.findLatestSentTo(
                clinicId,
                ReminderChannel.WHATSAPP,
                reply.senders.flatMap((sender) => whatsAppNumberVariants(sender)),
                new Date(now.getTime() - REPLY_ATTRIBUTION_WINDOW_MS)
            ));

        if (reminder === null) {
            this.logger.debug(`WhatsApp message for clinic ${clinicId.toString()} matches no recent reminder`);

            return 'unmatched';
        }

        const result = await this.tracker.apply(reminder, {
            type: ReminderEventType.REPLIED,
            source: ReminderEventSource.EVOLUTION,
            externalId: reply.messageId,
            occurredAt: reply.occurredAt,
            detail: reply.text,
        });

        // "SAIR" and similar replies stop further WhatsApp reminders (L3-04). The opt-out has its
        // own idempotency key, so it is recorded even if the reply event was already stored.
        if (isOptOutReply(reply.text)) {
            await this.optOut.record({
                reminder,
                source: CommunicationPreferenceSource.WHATSAPP_REPLY,
                externalId: reply.messageId,
                occurredAt: reply.occurredAt,
                reason: reply.text,
            });
        }

        return result;
    }

    private count(result: WebhookResult): void {
        this.metrics.count(NotificationMetric.WEBHOOK, 1, {source: 'evolution', result});
    }
}
