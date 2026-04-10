import type {ProfessionalId} from '@domain/professional/entities';
import {type AllEntityProps, type EntityJson, type EntityProps, type CreateEntity} from '../../@shared/entity';
import {Person, PersonId, PersonType} from '../../person/entities';
import {PatientCreatedEvent, PatientChangedEvent, PatientDeletedEvent} from '../events';

export type PatientProps = EntityProps<Patient>;
export type CreatePatient = CreateEntity<Patient>;
export type UpdatePatient = Partial<PatientProps>;

export class Patient extends Person {
    professionalId: ProfessionalId | null;
    birthDate: Date | null;
    email: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;

    constructor(props: AllEntityProps<Patient>) {
        super(props);
        this.professionalId = props.professionalId ?? null;
        this.birthDate = props.birthDate ?? null;
        this.email = props.email ?? null;
        this.emergencyContactName = props.emergencyContactName ?? null;
        this.emergencyContactPhone = props.emergencyContactPhone ?? null;
        this.validate();
    }

    static create(props: CreatePatient): Patient {
        const now = new Date();

        const patient = new Patient({
            ...props,
            id: PatientId.generate(),
            name: props.name,
            documentId: props.documentId,
            phone: props.phone ?? null,
            gender: props.gender ?? null,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
            personType: props.personType ?? PersonType.NATURAL,
            professionalId: props.professionalId ?? null,
            birthDate: props.birthDate ?? null,
            email: props.email ?? null,
            emergencyContactName: props.emergencyContactName ?? null,
            emergencyContactPhone: props.emergencyContactPhone ?? null,
        });

        patient.addEvent(new PatientCreatedEvent({patient, timestamp: now}));

        return patient;
    }

    delete(): void {
        this.addEvent(new PatientDeletedEvent({patient: this}));
    }

    change(props: UpdatePatient): void {
        const oldState = new Patient(this);

        if (props.name !== undefined) {
            this.name = props.name;
        }

        if (props.phone !== undefined) {
            this.phone = props.phone;
        }

        if (props.gender !== undefined) {
            this.gender = props.gender;
        }

        if (props.birthDate !== undefined) {
            this.birthDate = props.birthDate;
        }

        if (props.email !== undefined) {
            this.email = props.email;
        }

        if (props.emergencyContactName !== undefined) {
            this.emergencyContactName = props.emergencyContactName;
        }

        if (props.emergencyContactPhone !== undefined) {
            this.emergencyContactPhone = props.emergencyContactPhone;
        }

        this.validate();

        this.addEvent(new PatientChangedEvent({oldState, newState: this}));
    }

    validate(): void {
        // Add validation logic if needed
    }

    toJSON(): EntityJson<Patient> {
        return {
            id: this.id.toJSON(),
            professionalId: this.professionalId?.toJSON() ?? null,
            name: this.name,
            documentId: this.documentId.toJSON(),
            phone: this.phone?.toJSON() ?? null,
            gender: this.gender ?? null,
            profiles: Array.from(this.profiles),
            personType: this.personType,
            birthDate: this.birthDate?.toJSON() ?? null,
            email: this.email,
            emergencyContactName: this.emergencyContactName,
            emergencyContactPhone: this.emergencyContactPhone,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}

export class PatientId extends PersonId {
    static from(value: string): PatientId {
        return new PatientId(value);
    }

    static generate(): PatientId {
        return new PatientId();
    }
}
