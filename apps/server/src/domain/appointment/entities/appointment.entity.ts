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
import {InvalidInputException, PreconditionException} from '../../@shared/exceptions';
import {AppointmentCreatedEvent, AppointmentChangedEvent, AppointmentDeletedEvent} from '../events';

export type AppointmentProps = EntityProps<Appointment>;
export type CreateAppointment = Omit<CreateEntity<Appointment>, 'status'> & {status?: AppointmentStatus};
export type UpdateAppointment = Partial<AppointmentProps>;

export enum AppointmentStatus {
    SCHEDULED = 'SCHEDULED',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED',
    NO_SHOW = 'NO_SHOW',
}

export enum AppointmentType {
    FIRST_VISIT = 'FIRST_VISIT',
    RETURN = 'RETURN',
    WALK_IN = 'WALK_IN',
    TELEMEDICINE = 'TELEMEDICINE',
    PROCEDURE = 'PROCEDURE',
}

export class Appointment extends AggregateRoot<AppointmentId> {
    patientId: PatientId;
    professionalId: ProfessionalId;
    startAt: Date;
    endAt: Date;
    durationMinutes: number;
    type: AppointmentType;
    canceledAt: Date | null;
    canceledReason: string | null;
    note: string | null;
    status: AppointmentStatus;

    constructor(props: AllEntityProps<Appointment>) {
        super(props);
        this.patientId = props.patientId;
        this.professionalId = props.professionalId;
        this.startAt = props.startAt;
        this.endAt = props.endAt;
        this.durationMinutes = props.durationMinutes;
        this.type = props.type;
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
        if (this.status === AppointmentStatus.COMPLETED || this.status === AppointmentStatus.CANCELLED) {
            throw new PreconditionException(`Cannot modify an appointment with status ${this.status}.`);
        }

        const oldState = new Appointment(this.toJSON() as any);

        if (props.startAt !== undefined) {
            this.startAt = props.startAt;
        }

        if (props.endAt !== undefined) {
            this.endAt = props.endAt;
        }

        if (props.durationMinutes !== undefined) {
            this.durationMinutes = props.durationMinutes;
        }

        if (props.type !== undefined) {
            this.type = props.type;
        }

        if (props.note !== undefined) {
            this.note = props.note;
        }

        this.validate();

        this.addEvent(new AppointmentChangedEvent({oldState, newState: this}));
    }

    cancel(reason: string): void {
        if (this.status !== AppointmentStatus.SCHEDULED && this.status !== AppointmentStatus.CONFIRMED) {
            throw new PreconditionException(`Cannot cancel an appointment with status ${this.status}.`);
        }

        const oldState = new Appointment(this.toJSON() as any);
        this.status = AppointmentStatus.CANCELLED;
        this.canceledAt = new Date();
        this.canceledReason = reason;

        this.addEvent(new AppointmentChangedEvent({oldState, newState: this}));
    }

    confirm(): void {
        if (this.status !== AppointmentStatus.SCHEDULED) {
            throw new PreconditionException(`Cannot confirm an appointment with status ${this.status}.`);
        }

        const oldState = new Appointment(this.toJSON() as any);
        this.status = AppointmentStatus.CONFIRMED;
        this.addEvent(new AppointmentChangedEvent({oldState, newState: this}));
    }

    complete(): void {
        if (this.status !== AppointmentStatus.CONFIRMED && this.status !== AppointmentStatus.SCHEDULED) {
            throw new PreconditionException(`Cannot complete an appointment with status ${this.status}.`);
        }

        const oldState = new Appointment(this.toJSON() as any);
        this.status = AppointmentStatus.COMPLETED;
        this.addEvent(new AppointmentChangedEvent({oldState, newState: this}));
    }

    noShow(): void {
        if (this.status !== AppointmentStatus.CONFIRMED && this.status !== AppointmentStatus.SCHEDULED) {
            throw new PreconditionException(`Cannot mark no-show for an appointment with status ${this.status}.`);
        }

        const oldState = new Appointment(this.toJSON() as any);
        this.status = AppointmentStatus.NO_SHOW;
        this.addEvent(new AppointmentChangedEvent({oldState, newState: this}));
    }

    validate(): void {
        if (this.startAt >= this.endAt) {
            throw new InvalidInputException('endAt must be after startAt', [
                {field: 'endAt', reason: 'endAt must be after startAt'},
            ]);
        }

        if (this.durationMinutes <= 0) {
            throw new InvalidInputException('durationMinutes must be positive', [
                {field: 'durationMinutes', reason: 'must be positive'},
            ]);
        }
    }

    toJSON(): EntityJson<Appointment> {
        return {
            id: this.id.toJSON(),
            patientId: this.patientId.toJSON(),
            professionalId: this.professionalId.toJSON(),
            startAt: this.startAt.toJSON(),
            endAt: this.endAt.toJSON(),
            durationMinutes: this.durationMinutes,
            type: this.type,
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
