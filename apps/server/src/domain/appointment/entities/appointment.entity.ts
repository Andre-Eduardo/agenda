import {
    AggregateRoot,
    type AllEntityProps,
    type EntityJson,
    type EntityProps,
    type CreateEntity,
} from '@domain/@shared/entity';
import {EntityId} from '@domain/@shared/entity/id';
import {InvalidInputException, PreconditionException} from '@domain/@shared/exceptions';
import {
    AppointmentCreatedEvent,
    AppointmentChangedEvent,
    AppointmentDeletedEvent,
    AppointmentCheckinEvent,
    AppointmentCalledEvent,
} from '@domain/appointment/events';
import type {ClinicMemberId} from '@domain/clinic-member/entities';
import type {ClinicId} from '@domain/clinic/entities';
import type {PatientId} from '@domain/patient/entities';
import type {ScheduledProcedure} from '@domain/procedure/procedure.entity';
import type {RoomId} from '@domain/room/entities';

export type AppointmentProps = EntityProps<Appointment>;
export type CreateAppointment = Omit<CreateEntity<Appointment>, 'status' | 'arrivedAt' | 'calledAt'> & {
    status?: AppointmentStatus;
};
export type UpdateAppointment = Partial<Omit<AppointmentProps, 'procedure'>> & {procedure?: ScheduledProcedure};

export enum AppointmentStatus {
    SCHEDULED = 'SCHEDULED',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED',
    NO_SHOW = 'NO_SHOW',
    ARRIVED = 'ARRIVED',
    IN_PROGRESS = 'IN_PROGRESS',
}

export enum AppointmentType {
    FIRST_VISIT = 'FIRST_VISIT',
    RETURN = 'RETURN',
    WALK_IN = 'WALK_IN',
    TELEMEDICINE = 'TELEMEDICINE',
    PROCEDURE = 'PROCEDURE',
}

const ALLOWED_STATUS_TRANSITIONS: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
    [AppointmentStatus.SCHEDULED]: [
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.ARRIVED,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.NO_SHOW,
    ],
    [AppointmentStatus.CONFIRMED]: [AppointmentStatus.ARRIVED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
    [AppointmentStatus.ARRIVED]: [AppointmentStatus.IN_PROGRESS, AppointmentStatus.CANCELLED],
    [AppointmentStatus.IN_PROGRESS]: [AppointmentStatus.COMPLETED],
    [AppointmentStatus.COMPLETED]: [],
    [AppointmentStatus.CANCELLED]: [],
    [AppointmentStatus.NO_SHOW]: [],
};

export class Appointment extends AggregateRoot<AppointmentId> {
    clinicId: ClinicId;
    patientId: PatientId;
    /** Membro que vai atender (geralmente um PROFESSIONAL). */
    attendedByMemberId: ClinicMemberId;
    /** Quem agendou (pode ser um SECRETARY, ADMIN, etc.). */
    createdByMemberId: ClinicMemberId;
    startAt: Date;
    endAt: Date;
    durationMinutes: number;
    procedure: ScheduledProcedure | null;
    type: AppointmentType;
    canceledAt: Date | null;
    canceledReason: string | null;
    note: string | null;
    status: AppointmentStatus;
    /** Momento em que o paciente deu entrada na recepção. */
    arrivedAt: Date | null;
    /** Momento em que o paciente foi chamado para a sala. */
    calledAt: Date | null;
    /** Sala do atendimento. Só usado quando Clinic.roomManagementEnabled está ativo. */
    roomId: RoomId | null;

    constructor(props: Omit<AllEntityProps<Appointment>, 'procedure'> & {procedure?: ScheduledProcedure | null}) {
        super(props);
        this.clinicId = props.clinicId;
        this.patientId = props.patientId;
        this.attendedByMemberId = props.attendedByMemberId;
        this.createdByMemberId = props.createdByMemberId;
        this.startAt = props.startAt;
        this.endAt = props.endAt;
        this.durationMinutes = props.durationMinutes;
        this.procedure = props.procedure ?? null;
        this.type = props.type;
        this.canceledAt = props.canceledAt ?? null;
        this.canceledReason = props.canceledReason ?? null;
        this.note = props.note ?? null;
        this.status = props.status ?? AppointmentStatus.SCHEDULED;
        this.arrivedAt = props.arrivedAt ?? null;
        this.calledAt = props.calledAt ?? null;
        this.roomId = props.roomId ?? null;
        this.validate();
    }

    static create(props: CreateAppointment): Appointment {
        if (props.type === AppointmentType.PROCEDURE && props.procedure == null) {
            throw new InvalidInputException('procedure.required');
        }

        const id = AppointmentId.generate();
        const now = new Date();

        const appointment = new Appointment({
            ...props,
            id,
            status: props.status ?? AppointmentStatus.SCHEDULED,
            canceledReason: props.canceledReason ?? null,
            note: props.note ?? null,
            canceledAt: props.canceledAt ?? null,
            roomId: props.roomId ?? null,
            arrivedAt: null,
            calledAt: null,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });

        appointment.addEvent(new AppointmentCreatedEvent({appointment, timestamp: now}));

        return appointment;
    }

    delete(): void {
        super.delete();
        this.addEvent(new AppointmentDeletedEvent({appointment: this}));
    }

    change(props: UpdateAppointment): void {
        if (
            this.status === AppointmentStatus.COMPLETED ||
            this.status === AppointmentStatus.CANCELLED ||
            this.status === AppointmentStatus.NO_SHOW
        ) {
            throw new PreconditionException(`Cannot modify an appointment with status ${this.status}.`);
        }

        if (
            props.type === AppointmentType.PROCEDURE &&
            this.type !== props.type &&
            (props.procedure ?? this.procedure) === null
        ) {
            throw new InvalidInputException('procedure.required');
        }

        const oldState = new Appointment(this);

        if (props.startAt !== undefined) {
            this.startAt = props.startAt;
        }

        if (props.endAt !== undefined) {
            this.endAt = props.endAt;
        }

        if (props.durationMinutes !== undefined) {
            this.durationMinutes = props.durationMinutes;
        }

        if (props.procedure !== undefined) {
            this.procedure = props.procedure;
        }

        if (props.type !== undefined) {
            this.type = props.type;
        }

        if (props.note !== undefined) {
            this.note = props.note;
        }

        if (props.attendedByMemberId !== undefined) {
            this.attendedByMemberId = props.attendedByMemberId;
        }

        if (props.roomId !== undefined) {
            this.roomId = props.roomId;
        }

        this.validate();

        this.addEvent(new AppointmentChangedEvent({oldState, newState: this}));
    }

    cancel(reason: string): void {
        this.assertStatusTransition(AppointmentStatus.CANCELLED);
        const normalizedReason = reason.trim();

        if (normalizedReason.length === 0) {
            throw new InvalidInputException('Cancellation reason is required', [
                {field: 'reason', reason: 'Cancellation reason is required'},
            ]);
        }

        const oldState = new Appointment(this);

        this.status = AppointmentStatus.CANCELLED;
        this.canceledAt = new Date();
        this.canceledReason = normalizedReason;

        this.addEvent(new AppointmentChangedEvent({oldState, newState: this}));
    }

    confirm(): void {
        this.assertStatusTransition(AppointmentStatus.CONFIRMED);

        const oldState = new Appointment(this);

        this.status = AppointmentStatus.CONFIRMED;
        this.addEvent(new AppointmentChangedEvent({oldState, newState: this}));
    }

    complete(): void {
        this.assertStatusTransition(AppointmentStatus.COMPLETED);

        const oldState = new Appointment(this);

        this.status = AppointmentStatus.COMPLETED;
        this.addEvent(new AppointmentChangedEvent({oldState, newState: this}));
    }

    noShow(): void {
        this.assertStatusTransition(AppointmentStatus.NO_SHOW);

        const oldState = new Appointment(this);

        this.status = AppointmentStatus.NO_SHOW;
        this.addEvent(new AppointmentChangedEvent({oldState, newState: this}));
    }

    checkin(): void {
        this.assertStatusTransition(AppointmentStatus.ARRIVED);

        const oldState = new Appointment(this);

        this.status = AppointmentStatus.ARRIVED;
        this.arrivedAt = new Date();

        this.addEvent(new AppointmentCheckinEvent({appointment: this}));
        this.addEvent(new AppointmentChangedEvent({oldState, newState: this}));
    }

    call(): void {
        this.assertStatusTransition(AppointmentStatus.IN_PROGRESS);

        const oldState = new Appointment(this);

        this.status = AppointmentStatus.IN_PROGRESS;
        this.calledAt = new Date();

        this.addEvent(new AppointmentCalledEvent({appointment: this}));
        this.addEvent(new AppointmentChangedEvent({oldState, newState: this}));
    }

    private assertStatusTransition(nextStatus: AppointmentStatus): void {
        if (!ALLOWED_STATUS_TRANSITIONS[this.status].includes(nextStatus)) {
            throw new PreconditionException(`Cannot transition an appointment from ${this.status} to ${nextStatus}.`);
        }
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
            clinicId: this.clinicId.toJSON(),
            patientId: this.patientId.toJSON(),
            attendedByMemberId: this.attendedByMemberId.toJSON(),
            createdByMemberId: this.createdByMemberId.toJSON(),
            startAt: this.startAt.toJSON(),
            endAt: this.endAt.toJSON(),
            durationMinutes: this.durationMinutes,
            procedure: this.procedure,
            type: this.type,
            canceledAt: this.canceledAt?.toJSON() ?? null,
            canceledReason: this.canceledReason,
            note: this.note,
            status: this.status,
            arrivedAt: this.arrivedAt?.toJSON() ?? null,
            calledAt: this.calledAt?.toJSON() ?? null,
            roomId: this.roomId?.toJSON() ?? null,
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
