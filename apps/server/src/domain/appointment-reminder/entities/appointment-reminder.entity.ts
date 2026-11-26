import {AggregateRoot, type AllEntityProps, type EntityJson, type CreateEntity} from '@domain/@shared/entity';
import {EntityId} from '@domain/@shared/entity/id';
import type {AppointmentId} from '@domain/appointment/entities';
import type {ClinicId} from '@domain/clinic/entities';
import type {PatientId} from '@domain/patient/entities';

export enum ReminderChannel {
    WHATSAPP = 'WHATSAPP',
    SMS = 'SMS',
    EMAIL = 'EMAIL',
}

export enum ReminderStatus {
    PENDING = 'PENDING',
    SENT = 'SENT',
    DELIVERED = 'DELIVERED',
    READ = 'READ',
    REPLIED = 'REPLIED',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED',
}

/** Delivery progress after a successful send. A status only moves forward on this scale. */
const DELIVERY_PROGRESS: Partial<Record<ReminderStatus, number>> = {
    [ReminderStatus.SENT]: 1,
    [ReminderStatus.DELIVERED]: 2,
    [ReminderStatus.READ]: 3,
    [ReminderStatus.REPLIED]: 4,
};

/** What the provider accepted on a successful send. */
export type ReminderSendReceipt = {
    /** Address the message went to, in the provider's format (e-mail, or digits-only number). */
    destination: string;
    providerMessageId: string | null;
};

export type CreateAppointmentReminder = CreateEntity<AppointmentReminder>;

export class AppointmentReminder extends AggregateRoot<AppointmentReminderId> {
    clinicId: ClinicId;
    appointmentId: AppointmentId;
    patientId: PatientId;
    channel: ReminderChannel;
    status: ReminderStatus;
    scheduledAt: Date;
    sentAt: Date | null;
    failedAt: Date | null;
    attempts: number;
    errorMessage: string | null;
    destination: string | null;
    providerMessageId: string | null;
    deliveredAt: Date | null;
    readAt: Date | null;
    repliedAt: Date | null;

    constructor(props: AllEntityProps<AppointmentReminder>) {
        super(props);
        this.clinicId = props.clinicId;
        this.appointmentId = props.appointmentId;
        this.patientId = props.patientId;
        this.channel = props.channel;
        this.status = props.status;
        this.scheduledAt = props.scheduledAt;
        this.sentAt = props.sentAt ?? null;
        this.failedAt = props.failedAt ?? null;
        this.attempts = props.attempts ?? 0;
        this.errorMessage = props.errorMessage ?? null;
        this.destination = props.destination ?? null;
        this.providerMessageId = props.providerMessageId ?? null;
        this.deliveredAt = props.deliveredAt ?? null;
        this.readAt = props.readAt ?? null;
        this.repliedAt = props.repliedAt ?? null;
    }

    static create(props: CreateAppointmentReminder): AppointmentReminder {
        const id = AppointmentReminderId.generate();
        const now = new Date();

        return new AppointmentReminder({
            ...props,
            id,
            status: props.status ?? ReminderStatus.PENDING,
            sentAt: props.sentAt ?? null,
            failedAt: props.failedAt ?? null,
            attempts: props.attempts ?? 0,
            errorMessage: props.errorMessage ?? null,
            destination: props.destination ?? null,
            providerMessageId: props.providerMessageId ?? null,
            deliveredAt: props.deliveredAt ?? null,
            readAt: props.readAt ?? null,
            repliedAt: props.repliedAt ?? null,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }

    /** Records an attempt the provider accepted. */
    markSent(sentAt: Date, receipt?: ReminderSendReceipt): void {
        this.status = ReminderStatus.SENT;
        this.sentAt = sentAt;
        this.attempts += 1;
        this.errorMessage = null;

        if (receipt !== undefined) {
            this.destination = receipt.destination;
            this.providerMessageId = receipt.providerMessageId;
        }

        this.update();
    }

    /**
     * Records a failed attempt. With `retryAt` the reminder goes back to the queue for another
     * attempt at that time; without it the failure is final.
     */
    markFailed(failedAt: Date, errorMessage: string, retryAt: Date | null = null): void {
        this.failedAt = failedAt;
        this.errorMessage = errorMessage;
        this.attempts += 1;

        if (retryAt === null) {
            this.status = ReminderStatus.FAILED;
        } else {
            this.status = ReminderStatus.PENDING;
            this.scheduledAt = retryAt;
        }

        this.update();
    }

    /** The provider confirmed the message reached the patient. Returns whether anything changed. */
    markDelivered(at: Date): boolean {
        if (this.deliveredAt !== null || !this.wasAccepted()) return false;

        this.deliveredAt = at;
        this.advanceTo(ReminderStatus.DELIVERED);
        this.update();

        return true;
    }

    /** The patient opened/read the message. Implies delivery. Returns whether anything changed. */
    markRead(at: Date): boolean {
        if (this.readAt !== null || !this.wasAccepted()) return false;

        this.deliveredAt ??= at;
        this.readAt = at;
        this.advanceTo(ReminderStatus.READ);
        this.update();

        return true;
    }

    /** The patient answered. Implies delivery and reading. Returns whether anything changed. */
    markReplied(at: Date): boolean {
        if (!this.wasAccepted()) return false;

        const firstReply = this.repliedAt === null;

        this.deliveredAt ??= at;
        this.readAt ??= at;
        this.repliedAt ??= at;
        this.advanceTo(ReminderStatus.REPLIED);
        this.update();

        return firstReply;
    }

    /**
     * The provider accepted the message but could not deliver it (bounce, rejection, error ack).
     * Ignored once the patient has read or answered, since the message evidently arrived.
     */
    markDeliveryFailed(at: Date, reason: string): boolean {
        if (this.status !== ReminderStatus.SENT && this.status !== ReminderStatus.DELIVERED) return false;

        this.status = ReminderStatus.FAILED;
        this.failedAt = at;
        this.errorMessage = reason;
        this.update();

        return true;
    }

    private wasAccepted(): boolean {
        return this.sentAt !== null && this.status !== ReminderStatus.CANCELLED;
    }

    private advanceTo(status: ReminderStatus): void {
        const current = DELIVERY_PROGRESS[this.status] ?? 0;
        const next = DELIVERY_PROGRESS[status] ?? 0;

        // A late "delivered" after a bounce (FAILED) or a read still moves the status forward.
        if (next > current) {
            this.status = status;
        }
    }

    cancel(): void {
        this.status = ReminderStatus.CANCELLED;
        this.update();
    }

    toJSON(): EntityJson<AppointmentReminder> {
        return {
            id: this.id.toJSON(),
            clinicId: this.clinicId.toJSON(),
            appointmentId: this.appointmentId.toJSON(),
            patientId: this.patientId.toJSON(),
            channel: this.channel,
            status: this.status,
            scheduledAt: this.scheduledAt.toJSON(),
            sentAt: this.sentAt?.toJSON() ?? null,
            failedAt: this.failedAt?.toJSON() ?? null,
            attempts: this.attempts,
            errorMessage: this.errorMessage,
            destination: this.destination,
            providerMessageId: this.providerMessageId,
            deliveredAt: this.deliveredAt?.toJSON() ?? null,
            readAt: this.readAt?.toJSON() ?? null,
            repliedAt: this.repliedAt?.toJSON() ?? null,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}

export class AppointmentReminderId extends EntityId<'AppointmentReminderId'> {
    static from(value: string): AppointmentReminderId {
        return new AppointmentReminderId(value);
    }

    static generate(): AppointmentReminderId {
        return new AppointmentReminderId();
    }
}
