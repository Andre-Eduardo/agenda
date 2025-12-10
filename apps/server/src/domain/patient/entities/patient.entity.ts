import {AggregateRoot, type AllEntityProps, type EntityJson, type EntityProps} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import {PersonId} from '../../person/entities';

export type PatientProps = EntityProps<Patient>;
export type UpdatePatient = Partial<PatientProps>;

export class Patient extends AggregateRoot<PatientId> {
    // In the future, patient-specific fields (like medical history summary) can be added here.
    // Currently, it links to Person via ID.

    constructor(props: AllEntityProps<Patient>) {
        super(props);
        // Initialize potential props here
    }

    toJSON(): EntityJson<Patient> {
        return {
            id: this.id.toJSON(),
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
        };
    }

    protected change(props: UpdatePatient): void {
        // Handle updates here
    }

    protected validate(): void {
        // Add validation logic if needed
    }
}

export class PatientId extends EntityId<'PatientId'> {
    static from(value: string): PatientId {
        return new PatientId(value);
    }

    static generate(): PatientId {
        return new PatientId();
    }
}
