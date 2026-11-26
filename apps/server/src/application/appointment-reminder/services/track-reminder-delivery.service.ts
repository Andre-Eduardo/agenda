import {Injectable} from '@nestjs/common';
import {Metrics, NotificationMetric} from '@application/@shared/telemetry';
import {Transactional} from '@domain/@shared/repository';
import {AppointmentReminderEventRepository} from '@domain/appointment-reminder/appointment-reminder-event.repository';
import {AppointmentReminderRepository} from '@domain/appointment-reminder/appointment-reminder.repository';
import {
    type AppointmentReminder,
    AppointmentReminderEvent,
    type ReminderEventSource,
    ReminderEventType,
} from '@domain/appointment-reminder/entities';

/** A status reported by a provider webhook about a reminder that was already sent. */
export type ReminderDeliveryUpdate = {
    type:
        | ReminderEventType.DELIVERED
        | ReminderEventType.READ
        | ReminderEventType.DELIVERY_FAILED
        | ReminderEventType.COMPLAINED
        | ReminderEventType.REPLIED;
    source: ReminderEventSource;
    /** Idempotency key: a second update with the same source + id is ignored. */
    externalId: string;
    occurredAt: Date;
    detail?: string | null;
};

export type ReminderDeliveryOutcome = 'applied' | 'duplicate';

/**
 * Applies provider webhooks to a reminder: appends the event to its timeline and moves its status.
 * Both happen in one transaction, and the event insert is the idempotency gate — a repeated
 * webhook delivery (providers retry on timeouts) changes nothing.
 */
@Injectable()
export class TrackReminderDeliveryService {
    constructor(
        private readonly reminderRepository: AppointmentReminderRepository,
        private readonly eventRepository: AppointmentReminderEventRepository,
        private readonly metrics: Metrics
    ) {}

    @Transactional()
    async apply(reminder: AppointmentReminder, update: ReminderDeliveryUpdate): Promise<ReminderDeliveryOutcome> {
        const recorded = await this.eventRepository.recordIfAbsent(
            AppointmentReminderEvent.record({
                clinicId: reminder.clinicId,
                reminderId: reminder.id,
                type: update.type,
                source: update.source,
                externalId: update.externalId,
                attempt: reminder.attempts,
                occurredAt: update.occurredAt,
                detail: update.detail ?? null,
            })
        );

        if (!recorded) return 'duplicate';

        if (this.applyToReminder(reminder, update)) {
            await this.reminderRepository.save(reminder);
        }

        this.metrics.count(NotificationMetric.STATUS, 1, {channel: reminder.channel, type: update.type});

        return 'applied';
    }

    private applyToReminder(reminder: AppointmentReminder, update: ReminderDeliveryUpdate): boolean {
        const {type, occurredAt} = update;

        if (type === ReminderEventType.DELIVERED) return reminder.markDelivered(occurredAt);

        if (type === ReminderEventType.READ) return reminder.markRead(occurredAt);

        if (type === ReminderEventType.REPLIED) return reminder.markReplied(occurredAt);

        if (type === ReminderEventType.DELIVERY_FAILED) {
            return reminder.markDeliveryFailed(occurredAt, update.detail ?? 'Delivery failed');
        }

        // COMPLAINED is only recorded on the timeline; opt-out handling is card L3-04.
        return false;
    }
}
