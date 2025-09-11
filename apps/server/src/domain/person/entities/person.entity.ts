import {AggregateRoot, type AllEntityProps, type EntityJson, type EntityProps} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import {InvalidInputException} from '../../@shared/exceptions';
import type {DocumentId, Phone} from '../../@shared/value-objects';
import type {CompanyId} from '../../company/entities';

export type PersonProps = EntityProps<Person>;
export type UpdatePerson = Omit<Partial<PersonProps>, 'companyId'>;

export enum Gender {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
    OTHER = 'OTHER',
}
export enum PersonProfile {
    CUSTOMER = 'CUSTOMER',
    EMPLOYEE = 'EMPLOYEE',
    SUPPLIER = 'SUPPLIER',
}

export enum PersonType {
    NATURAL = 'NATURAL',
    LEGAL = 'LEGAL',
}

export class Person extends AggregateRoot<PersonId> {
    companyId: CompanyId;
    /** Represents the name of the natural person or the trade name of the legal person. */
    name: string;
    companyName?: string | null;
    documentId: DocumentId;
    profiles: Set<PersonProfile>;
    personType: PersonType;
    phone: Phone | null;
    gender?: Gender | null;

    constructor(props: AllEntityProps<Person>) {
        super(props);

        this.personType = props.personType;
        this.companyId = props.companyId;
        this.name = props.name;
        this.profiles = props.profiles;
        this.companyName = props.companyName ?? null;
        this.documentId = props.documentId;
        this.phone = props.phone ?? null;
        this.gender = props.gender ?? null;
        this.validate();
    }

    toJSON(): EntityJson<Person> {
        return {
            id: this.id.toJSON(),
            name: this.name,
            companyName: this.companyName ?? null,
            companyId: this.companyId.toJSON(),
            gender: this.gender ?? null,
            profiles: Array.from(this.profiles),
            personType: this.personType,
            documentId: this.documentId.toJSON(),
            phone: this.phone?.toJSON() ?? null,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
        };
    }

    protected change(props: UpdatePerson): void {
        if (props.profiles !== undefined) {
            this.profiles = props.profiles;
        }

        if (props.name !== undefined) {
            this.name = props.name;
            this.validate('name');
        }

        if (props.documentId !== undefined) {
            this.documentId = props.documentId;
        }

        if (props.personType !== undefined) {
            this.personType = props.personType;
        }

        if (props.companyName !== undefined) {
            this.companyName = props.companyName;
            this.validate('companyName');
        }

        if (props.phone !== undefined) {
            this.phone = props.phone;
        }

        if (props.gender !== undefined) {
            this.gender = props.gender;
            this.validate('gender');
        }
    }

    protected validate(...fields: Array<keyof PersonProps>): void {
        if (fields.length === 0 || fields.includes('name')) {
            if (this.name.length < 1) {
                throw new InvalidInputException('Person name must be at least 1 character long.');
            }
        }

        if (fields.length === 0 || fields.includes('companyName')) {
            if (this.companyName !== null && this.personType !== PersonType.LEGAL) {
                throw new InvalidInputException('Only legal persons can have a company name.');
            }
        }

        if (fields.length === 0 || fields.includes('gender')) {
            if (this.gender !== null && this.personType !== PersonType.NATURAL) {
                throw new InvalidInputException('Only natural persons can have a gender.');
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
