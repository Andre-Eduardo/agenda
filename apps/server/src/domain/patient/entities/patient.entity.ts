import type {ProfessionalId} from '@domain/professional/entities';
import {type AllEntityProps, type EntityJson, type EntityProps, type CreateEntity} from '../../@shared/entity';
import {Person, PersonId, PersonType} from '../../person/entities';
import {PatientCreatedEvent, PatientChangedEvent, PatientDeletedEvent} from '../events';

export type PatientProps = EntityProps<Patient>;
export type CreatePatient = CreateEntity<Patient>;
export type UpdatePatient = Partial<PatientProps>;

export class Patient extends Person {
    professionalId: ProfessionalId | null;

    constructor(props: AllEntityProps<Patient>) {
        super(props);
        this.professionalId = props.professionalId ?? null;
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
        });

        patient.addEvent(new PatientCreatedEvent({patient, timestamp: now}));

        return patient;
    }

    delete(): void {
        this.addEvent(new PatientDeletedEvent({patient: this}));
    }

    change(): void {
        const oldState = new Patient(this);

        // No current props to update, but structure is here for future expansion
        // if (props.someField !== undefined) { this.someField = props.someField; }

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
