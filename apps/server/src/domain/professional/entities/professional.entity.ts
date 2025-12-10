import {AggregateRoot, type AllEntityProps, type EntityJson, type EntityProps} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import {PersonId} from '../../person/entities';
import {UserId} from '../../user/entities/user.entity';

export type ProfessionalProps = EntityProps<Professional>;
export type UpdateProfessional = Partial<ProfessionalProps>;

export class Professional extends AggregateRoot<ProfessionalId> {
    personId: PersonId;
    userId: UserId | null;
    allowSystemAccess: boolean;
    specialty: string | null;

    constructor(props: AllEntityProps<Professional>) {
        super(props);
        this.personId = props.personId;
        this.userId = props.userId ?? null;
        this.allowSystemAccess = props.allowSystemAccess;
        this.specialty = props.specialty ?? null;
    }

    toJSON(): EntityJson<Professional> {
        return {
            id: this.id.toJSON(),
            personId: this.personId.toJSON(),
            userId: this.userId?.toJSON() ?? null,
            allowSystemAccess: this.allowSystemAccess,
            specialty: this.specialty,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
        };
    }

    protected change(props: UpdateProfessional): void {
        if (props.userId !== undefined) {
            this.userId = props.userId;
        }
        if (props.allowSystemAccess !== undefined) {
            this.allowSystemAccess = props.allowSystemAccess;
        }
        if (props.specialty !== undefined) {
            this.specialty = props.specialty;
        }
    }

    protected validate(): void {
        // Add validation logic if needed
    }
}

export class ProfessionalId extends EntityId<'ProfessionalId'> {
    static from(value: string): ProfessionalId {
        return new ProfessionalId(value);
    }

    static generate(): ProfessionalId {
        return new ProfessionalId();
    }
}
