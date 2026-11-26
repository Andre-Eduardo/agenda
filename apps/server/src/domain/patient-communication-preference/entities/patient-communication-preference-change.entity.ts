import {Entity, type AllEntityProps, type EntityJson} from '@domain/@shared/entity';
import {EntityId} from '@domain/@shared/entity/id';
import type {ReminderChannel} from '@domain/appointment-reminder/entities';
import type {ClinicMemberId} from '@domain/clinic-member/entities';
import type {ClinicId} from '@domain/clinic/entities';
import type {PatientId} from '@domain/patient/entities';

/** How a preference change reached the system. */
export enum CommunicationPreferenceSource {
    /** A clinic member recorded it at the patient's request. */
    STAFF = 'STAFF',
    /** The patient answered a WhatsApp reminder with an opt-out keyword. */
    WHATSAPP_REPLY = 'WHATSAPP_REPLY',
    /** The patient marked a reminder e-mail as spam. */
    EMAIL_COMPLAINT = 'EMAIL_COMPLAINT',
}

/** Longest `reason` kept (free text from staff, or the patient's reply). */
export const COMMUNICATION_PREFERENCE_REASON_MAX_LENGTH = 500;

export type RecordCommunicationPreferenceChange = {
    clinicId: ClinicId;
    patientId: PatientId;
    channel: ReminderChannel;
    optedOut: boolean;
    source: CommunicationPreferenceSource;
    occurredAt: Date;
    changedByMemberId?: ClinicMemberId | null;
    reason?: string | null;
    externalId?: string | null;
};

/**
 * LGPD evidence (L3-04): one change of a patient's consent to be contacted on a channel.
 * Append-only: the current preference of a channel is its latest change, and the history
 * of who changed it, when and how is never rewritten.
 */
export class PatientCommunicationPreferenceChange extends Entity<PatientCommunicationPreferenceChangeId> {
    readonly clinicId: ClinicId;
    readonly patientId: PatientId;
    readonly channel: ReminderChannel;
    readonly optedOut: boolean;
    readonly source: CommunicationPreferenceSource;
    readonly changedByMemberId: ClinicMemberId | null;
    readonly reason: string | null;
    readonly externalId: string | null;
    readonly occurredAt: Date;

    constructor(props: AllEntityProps<PatientCommunicationPreferenceChange>) {
        super(props);
        this.clinicId = props.clinicId;
        this.patientId = props.patientId;
        this.channel = props.channel;
        this.optedOut = props.optedOut;
        this.source = props.source;
        this.changedByMemberId = props.changedByMemberId ?? null;
        this.reason = props.reason ?? null;
        this.externalId = props.externalId ?? null;
        this.occurredAt = props.occurredAt;
    }

    static record(props: RecordCommunicationPreferenceChange): PatientCommunicationPreferenceChange {
        const now = new Date();

        return new PatientCommunicationPreferenceChange({
            ...props,
            id: PatientCommunicationPreferenceChangeId.generate(),
            changedByMemberId: props.changedByMemberId ?? null,
            reason: normalizeReason(props.reason ?? null),
            externalId: props.externalId ?? null,
            createdAt: now,
            updatedAt: now,
        });
    }

    toJSON(): EntityJson<PatientCommunicationPreferenceChange> {
        return {
            id: this.id.toJSON(),
            clinicId: this.clinicId.toJSON(),
            patientId: this.patientId.toJSON(),
            channel: this.channel,
            optedOut: this.optedOut,
            source: this.source,
            changedByMemberId: this.changedByMemberId?.toJSON() ?? null,
            reason: this.reason,
            externalId: this.externalId,
            occurredAt: this.occurredAt.toJSON(),
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: null,
        };
    }
}

function normalizeReason(value: string | null): string | null {
    if (value === null) return null;

    const trimmed = value.trim();

    if (trimmed === '') return null;

    return trimmed.length > COMMUNICATION_PREFERENCE_REASON_MAX_LENGTH
        ? `${trimmed.slice(0, COMMUNICATION_PREFERENCE_REASON_MAX_LENGTH - 1)}…`
        : trimmed;
}

export class PatientCommunicationPreferenceChangeId extends EntityId<'PatientCommunicationPreferenceChangeId'> {
    static from(value: string): PatientCommunicationPreferenceChangeId {
        return new PatientCommunicationPreferenceChangeId(value);
    }

    static generate(): PatientCommunicationPreferenceChangeId {
        return new PatientCommunicationPreferenceChangeId();
    }
}
