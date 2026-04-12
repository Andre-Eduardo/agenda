import {type AllEntityProps, type EntityJson, type EntityProps, type CreateEntity} from '../../@shared/entity';
import {Person, PersonId, PersonType} from '../../person/entities/person.entity';
import type {UserId} from '../../user/entities/user.entity';
import {ProfessionalCreatedEvent, ProfessionalChangedEvent, ProfessionalDeletedEvent} from '../events';
import type {ProfessionalConfigId} from './professional-config';
import type {Specialty} from '../../form-template/entities';

export type ProfessionalProps = EntityProps<Professional>;
export type CreateProfessional = CreateEntity<Professional>;
export type UpdateProfessional = Partial<ProfessionalProps>;

export class Professional extends Person {
    configId: ProfessionalConfigId;
    userId: UserId | null;
    specialty: string;
    /** Especialidade normalizada como enum, derivada do campo `specialty` no cadastro. */
    specialtyNormalized: Specialty | null;

    constructor(props: AllEntityProps<Professional>) {
        super(props);
        this.configId = props.configId;
        this.userId = props.userId ?? null;
        this.specialty = props.specialty;
        this.specialtyNormalized = props.specialtyNormalized ?? null;
        this.validate();
    }

    static create(props: CreateProfessional): Professional {
        const now = new Date();

        const professional = new Professional({
            ...props,
            id: ProfessionalId.generate(),
            name: props.name,
            documentId: props.documentId,
            phone: props.phone ?? null,
            gender: props.gender ?? null,
            personType: props.personType ?? PersonType.NATURAL,
            configId: props.configId,
            userId: props.userId ?? null,
            specialty: props.specialty,
            specialtyNormalized: props.specialtyNormalized ?? null,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });

        professional.addEvent(new ProfessionalCreatedEvent({professional, timestamp: now}));

        return professional;
    }

    delete(): void {
        this.addEvent(new ProfessionalDeletedEvent({professional: this}));
    }

    change(props: UpdateProfessional): void {
        const oldState = new Professional(this);

        if (props.userId !== undefined) {
            this.userId = props.userId;
        }

        if (props.specialty !== undefined) {
            this.specialty = props.specialty;
        }

        if (props.specialtyNormalized !== undefined) {
            this.specialtyNormalized = props.specialtyNormalized;
        }

        this.validate();

        this.addEvent(new ProfessionalChangedEvent({oldState, newState: this}));
    }

    validate(): void {
        // Add validation logic if needed
    }

    toJSON(): EntityJson<Professional> {
        return {
            id: this.id.toJSON(),
            name: this.name,
            documentId: this.documentId.toJSON(),
            phone: this.phone?.toJSON() ?? null,
            gender: this.gender ?? null,
            profiles: Array.from(this.profiles),
            personType: this.personType,
            configId: this.configId.toJSON(),
            userId: this.userId?.toJSON() ?? null,
            specialty: this.specialty,
            specialtyNormalized: this.specialtyNormalized,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}

export class ProfessionalId extends PersonId {
    static override from(value: string): ProfessionalId {
        return new ProfessionalId(value);
    }

    static override generate(): ProfessionalId {
        return new ProfessionalId();
    }
}
