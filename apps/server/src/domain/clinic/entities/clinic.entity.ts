import {
    AggregateRoot,
    type AllEntityProps,
    type CreateEntity,
    type EntityJson,
    type EntityProps,
} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import {InvalidInputException} from '../../@shared/exceptions';
import type {DocumentId, Email, Phone} from '../../@shared/value-objects';
import {ClinicCreatedEvent, ClinicChangedEvent, ClinicDeletedEvent} from '../events';

export type ClinicProps = EntityProps<Clinic>;
export type CreateClinic = CreateEntity<Clinic>;
export type UpdateClinic = Partial<ClinicProps>;

export class Clinic extends AggregateRoot<ClinicId> {
    name: string;
    documentId: DocumentId | null;
    phone: Phone | null;
    email: Email | null;
    /** true = autônomo usando o sistema sem clínica real. Front simplifica UI. */
    isPersonalClinic: boolean;

    constructor(props: AllEntityProps<Clinic>) {
        super(props);
        this.name = props.name;
        this.documentId = props.documentId ?? null;
        this.phone = props.phone ?? null;
        this.email = props.email ?? null;
        this.isPersonalClinic = props.isPersonalClinic;
        this.validate();
    }

    static create(props: CreateClinic): Clinic {
        const now = new Date();

        const clinic = new Clinic({
            ...props,
            id: ClinicId.generate(),
            name: props.name,
            documentId: props.documentId ?? null,
            phone: props.phone ?? null,
            email: props.email ?? null,
            isPersonalClinic: props.isPersonalClinic ?? false,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });

        clinic.addEvent(new ClinicCreatedEvent({clinic, timestamp: now}));

        return clinic;
    }

    change(props: UpdateClinic): void {
        const oldState = new Clinic(this);

        if (props.name !== undefined) {
            this.name = props.name;
        }

        if (props.documentId !== undefined) {
            this.documentId = props.documentId;
        }

        if (props.phone !== undefined) {
            this.phone = props.phone;
        }

        if (props.email !== undefined) {
            this.email = props.email;
        }

        this.validate();
        this.addEvent(new ClinicChangedEvent({oldState, newState: this}));
    }

    delete(): void {
        super.delete();
        this.addEvent(new ClinicDeletedEvent({clinic: this}));
    }

    private validate(): void {
        if (this.name.length < 1) {
            throw new InvalidInputException('Clinic name must be at least 1 character long.');
        }
    }

    toJSON(): EntityJson<Clinic> {
        return {
            id: this.id.toJSON(),
            name: this.name,
            documentId: this.documentId?.toJSON() ?? null,
            phone: this.phone?.toJSON() ?? null,
            email: this.email?.toJSON() ?? null,
            isPersonalClinic: this.isPersonalClinic,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}

export class ClinicId extends EntityId<'ClinicId'> {
    static from(value: string): ClinicId {
        return new ClinicId(value);
    }

    static generate(): ClinicId {
        return new ClinicId();
    }
}
