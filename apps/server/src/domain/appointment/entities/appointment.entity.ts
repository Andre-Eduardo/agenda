import {
    AggregateRoot,
    type AllEntityProps,
    type EntityJson,
    type EntityProps,
    type CreateEntity,
} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import type {PatientId} from '../../patient/entities';
import type {ProfessionalId} from '../../professional/entities';
import {AppointmentCreatedEvent, AppointmentChangedEvent, AppointmentDeletedEvent} from '../events';

export type AppointmentProps = EntityProps<Appointment>;
export type CreateAppointment = Omit<CreateEntity<Appointment>, 'status'> & {status?: AppointmentStatus};
export type UpdateAppointment = Partial<AppointmentProps>;

export enum AppointmentStatus {
    SCHEDULED = 'SCHEDULED',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED',
}

export class Appointment extends AggregateRoot<AppointmentId> {
    patientId: PatientId;
    professionalId: ProfessionalId;
    date: Date;
    canceledAt: Date | null;
    canceledReason: string | null;
    note: string | null;
    status: AppointmentStatus;

    constructor(props: AllEntityProps<Appointment>) {
        super(props);
        this.patientId = props.patientId;
        this.professionalId = props.professionalId;
        this.date = props.date;
        this.canceledAt = props.canceledAt ?? null;
        this.canceledReason = props.canceledReason ?? null;
        this.note = props.note ?? null;
        this.status = props.status ?? AppointmentStatus.SCHEDULED;
        this.validate();
    }

    static create(props: CreateAppointment): Appointment {
        const id = AppointmentId.generate();
        const now = new Date();

        const appointment = new Appointment({
            ...props,
            id,
            status: props.status ?? AppointmentStatus.SCHEDULED,
            canceledReason: props.canceledReason ?? null,
            note: props.note ?? null,
            canceledAt: props.canceledAt ?? null,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });

        appointment.addEvent(new AppointmentCreatedEvent({appointment, timestamp: now}));

        return appointment;
    }

    delete(): void {
        this.addEvent(new AppointmentDeletedEvent({appointment: this}));
    }

    change(props: UpdateAppointment): void {
        const oldState = new Appointment(this.toJSON() as any); // Reconstruct mostly works

        if (props.date !== undefined) {
            this.date = props.date;
        }

        if (props.canceledAt !== undefined) {
            this.canceledAt = props.canceledAt;
        }

        if (props.canceledReason !== undefined) {
            this.canceledReason = props.canceledReason;
        }

        if (props.note !== undefined) {
            this.note = props.note;
        }

        this.validate();

        this.addEvent(new AppointmentChangedEvent({oldState, newState: this}));
    }

    validate(): void {
        // Validation logic
    }

    toJSON(): EntityJson<Appointment> {
        return {
            id: this.id.toJSON(),
            patientId: this.patientId.toJSON(),
            professionalId: this.professionalId.toJSON(),
            date: this.date.toJSON(),
            canceledAt: this.canceledAt?.toJSON() ?? null,
            canceledReason: this.canceledReason,
            note: this.note,
            status: this.status,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}

export class AppointmentId extends EntityId<'AppointmentId'> {
    static from(value: string): AppointmentId {
        return new AppointmentId(value);
    }

    static generate(): AppointmentId {
        return new AppointmentId();
    }
}
