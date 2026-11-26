import {Entity, type AllEntityProps, type EntityJson} from '@domain/@shared/entity';
import {EntityId} from '@domain/@shared/entity/id';
import type {AppointmentReminderId} from '@domain/appointment-reminder/entities/appointment-reminder.entity';
import type {ClinicId} from '@domain/clinic/entities';

/** One step of a reminder's timeline. */
export enum ReminderEventType {
    /** The provider accepted an attempt. */
    SENT = 'SENT',
    /** An attempt failed before the provider accepted it. */
    SEND_FAILED = 'SEND_FAILED',
    /** A failed attempt will be repeated at `occurredAt`. */
    RETRY_SCHEDULED = 'RETRY_SCHEDULED',
    DELIVERED = 'DELIVERED',
    READ = 'READ',
    /** Accepted by the provider but not delivered (bounce, rejection, error ack). */
    DELIVERY_FAILED = 'DELIVERY_FAILED',
    /** The patient marked the e-mail as spam. */
    COMPLAINED = 'COMPLAINED',
    REPLIED = 'REPLIED',
}

/** Who reported the event. Webhook sources carry an `externalId` that makes them idempotent. */
export enum ReminderEventSource {
    SYSTEM = 'SYSTEM',
    EVOLUTION = 'EVOLUTION',
    SES = 'SES',
}

/** Longest `detail` kept (error messages, patient replies). */
export const REMINDER_EVENT_DETAIL_MAX_LENGTH = 500;

export type RecordReminderEvent = {
    clinicId: ClinicId;
    reminderId: AppointmentReminderId;
    type: ReminderEventType;
    source: ReminderEventSource;
    occurredAt: Date;
    externalId?: string | null;
    attempt?: number | null;
    detail?: string | null;
};

/** Append-only: an event is never changed after it is recorded. */
export class AppointmentReminderEvent extends Entity<AppointmentReminderEventId> {
    readonly clinicId: ClinicId;
    readonly reminderId: AppointmentReminderId;
    readonly type: ReminderEventType;
    readonly source: ReminderEventSource;
    readonly externalId: string | null;
    readonly attempt: number | null;
    readonly detail: string | null;
    readonly occurredAt: Date;

    constructor(props: AllEntityProps<AppointmentReminderEvent>) {
        super(props);
        this.clinicId = props.clinicId;
        this.reminderId = props.reminderId;
        this.type = props.type;
        this.source = props.source;
        this.externalId = props.externalId ?? null;
        this.attempt = props.attempt ?? null;
        this.detail = props.detail ?? null;
        this.occurredAt = props.occurredAt;
    }

    static record(props: RecordReminderEvent): AppointmentReminderEvent {
        const now = new Date();

        return new AppointmentReminderEvent({
            ...props,
            id: AppointmentReminderEventId.generate(),
            externalId: props.externalId ?? null,
            attempt: props.attempt ?? null,
            detail: truncate(props.detail ?? null),
            createdAt: now,
            updatedAt: now,
        });
    }

    toJSON(): EntityJson<AppointmentReminderEvent> {
        return {
            id: this.id.toJSON(),
            clinicId: this.clinicId.toJSON(),
            reminderId: this.reminderId.toJSON(),
            type: this.type,
            source: this.source,
            externalId: this.externalId,
            attempt: this.attempt,
            detail: this.detail,
            occurredAt: this.occurredAt.toJSON(),
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: null,
        };
    }
}

function truncate(value: string | null): string | null {
    if (value === null) return null;

    const trimmed = value.trim();

    if (trimmed === '') return null;

    return trimmed.length > REMINDER_EVENT_DETAIL_MAX_LENGTH
        ? `${trimmed.slice(0, REMINDER_EVENT_DETAIL_MAX_LENGTH - 1)}…`
        : trimmed;
}

export class AppointmentReminderEventId extends EntityId<'AppointmentReminderEventId'> {
    static from(value: string): AppointmentReminderEventId {
        return new AppointmentReminderEventId(value);
    }

    static generate(): AppointmentReminderEventId {
        return new AppointmentReminderEventId();
    }
}
