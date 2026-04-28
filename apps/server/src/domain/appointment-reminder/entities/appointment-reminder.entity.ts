import {AggregateRoot, type AllEntityProps, type EntityJson, type CreateEntity} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import type {ClinicId} from '../../clinic/entities';
import type {AppointmentId} from '../../appointment/entities';
import type {PatientId} from '../../patient/entities';

export enum ReminderChannel {
    WHATSAPP = 'WHATSAPP',
    SMS = 'SMS',
    EMAIL = 'EMAIL',
}

export enum ReminderStatus {
    PENDING = 'PENDING',
    SENT = 'SENT',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED',
}

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
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }

    markSent(sentAt: Date): void {
        this.status = ReminderStatus.SENT;
        this.sentAt = sentAt;
        this.update();
    }

    markFailed(failedAt: Date, errorMessage: string): void {
        this.status = ReminderStatus.FAILED;
        this.failedAt = failedAt;
        this.errorMessage = errorMessage;
        this.attempts += 1;
        this.update();
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
