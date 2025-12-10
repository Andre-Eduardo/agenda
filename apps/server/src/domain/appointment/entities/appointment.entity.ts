import {AggregateRoot, type AllEntityProps, type EntityJson, type EntityProps} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import {PatientId} from '../../patient/entities';
import {ProfessionalId} from '../../professional/entities';

export type AppointmentProps = EntityProps<Appointment>;
export type UpdateAppointment = Partial<AppointmentProps>;

export class Appointment extends AggregateRoot<AppointmentId> {
    patientId: PatientId;
    professionalId: ProfessionalId;
    date: Date;
    canceledAt: Date | null;
    canceledReason: string | null;
    note: string | null;

    constructor(props: AllEntityProps<Appointment>) {
        super(props);
        this.patientId = props.patientId;
        this.professionalId = props.professionalId;
        this.date = props.date;
        this.canceledAt = props.canceledAt ?? null;
        this.canceledReason = props.canceledReason ?? null;
        this.note = props.note ?? null;
    }

    toJSON(): EntityJson<Appointment> {
        return {
            id: this.id.toJSON(),
            patientId: this.patientId.toJSON(),
            professionalId: this.professionalId.toJSON(),
            date: this.date,
            canceledAt: this.canceledAt,
            canceledReason: this.canceledReason,
            note: this.note,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
        };
    }

    protected change(props: UpdateAppointment): void {
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
    }

    protected validate(): void {
        // Validation logic
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
