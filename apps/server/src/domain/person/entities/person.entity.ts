import { UserId } from '@domain/user/entities';
import {AggregateRoot, type AllEntityProps, type EntityJson, type EntityProps} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import {InvalidInputException} from '../../@shared/exceptions';
import type {DocumentId, Phone} from '../../@shared/value-objects';
import {PersonDeletedEvent} from '../events';


export type PersonProps = EntityProps<Person>;
export type UpdatePerson = Partial<PersonProps>;

export enum PersonType {
    NATURAL = 'NATURAL',
    LEGAL = 'LEGAL',
}
export enum Gender {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
    OTHER = 'OTHER',
}
export class Person extends AggregateRoot<PersonId> {
    name: string;
    documentId: DocumentId | null;
    phone: Phone | null;
    gender: Gender | null;
    personType: PersonType;

    constructor(props: AllEntityProps<Person>) {
        super(props);

        this.name = props.name;
        this.documentId = props.documentId ?? null;
        this.phone = props.phone ?? null;
        this.gender = props.gender ?? null;
        this.personType = props.personType ?? PersonType.NATURAL;
        this.validate();
    }

    protected change(props: UpdatePerson): void {
        if (props.name !== undefined) {
            this.name = props.name;
            this.validate('name');
        }

        if (props.documentId !== undefined) {
            this.documentId = props.documentId;
        }

        if (props.phone !== undefined) {
            this.phone = props.phone;
        }

        if (props.gender !== undefined) {
            this.gender = props.gender;
            this.validate('gender');
        }
    }


    delete(): void {
        super.delete();

        this.addEvent(new PersonDeletedEvent({person: this, timestamp: this.deletedAt ?? undefined}));
    }


    toJSON(): EntityJson<Person> {
        return {
            id: this.id.toJSON(),
            name: this.name,
            gender: this.gender ?? null,
            documentId: this.documentId?.toJSON() ?? null,
            phone: this.phone?.toJSON() ?? null,
            personType: this.personType,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }

    protected validate(...fields: Array<keyof PersonProps>): void {
        if (fields.length === 0 || fields.includes('name')) {
            if (this.name.length === 0) {
                throw new InvalidInputException('Person name must be at least 1 character long.');
            }
        }

        if (fields.length === 0 || fields.includes('gender')) {
            if (
                this.gender !== null &&
                this.gender !== Gender.MALE &&
                this.gender !== Gender.FEMALE &&
                this.gender !== Gender.OTHER
            ) {
                throw new InvalidInputException('Invalid gender.');
            }
        }
    }
}

export class PersonId extends EntityId<'PersonId'> {
    static from(value: string): PersonId {
        return new PersonId(value);
    }

    static generate(): PersonId {
        return new PersonId();
    }
}
