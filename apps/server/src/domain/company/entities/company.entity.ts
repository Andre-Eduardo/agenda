import type {CreateEntity, EntityProps, AllEntityProps, EntityJson} from '../../@shared/entity';
import {AggregateRoot} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import {InvalidInputException} from '../../@shared/exceptions';
import {CompanyCreatedEvent, CompanyDeletedEvent, CompanyChangedEvent} from '../events';

export type CompanyProps = EntityProps<Company>;
export type CreateCompany = CreateEntity<Company>;
export type UpdateCompany = Partial<CompanyProps>;

export class Company extends AggregateRoot<CompanyId> {
    name: string;

    constructor(props: AllEntityProps<Company>) {
        super(props);
        this.name = props.name;
        this.validate();
    }

    static create(props: CreateCompany): Company {
        const companyId = CompanyId.generate();
        const now = new Date();

        const company = new Company({
            ...props,
            id: companyId,
            createdAt: now,
            updatedAt: now,
        });

        company.addEvent(new CompanyCreatedEvent({companyId, company, timestamp: now}));

        return company;
    }

    change(props: UpdateCompany): void {
        const oldCompany = new Company(this);

        if (props.name !== undefined) {
            this.name = props.name;
            this.validate('name');
        }

        this.addEvent(
            new CompanyChangedEvent({
                companyId: this.id,
                oldState: oldCompany,
                newState: this,
            })
        );
    }

    delete(): void {
        this.addEvent(new CompanyDeletedEvent({companyId: this.id, company: this}));
    }

    toJSON(): EntityJson<Company> {
        return {
            id: this.id.toJSON(),
            name: this.name,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
        };
    }

    private validate(...fields: Array<keyof CompanyProps>): void {
        if (fields.length === 0 || fields.includes('name')) {
            if (this.name.length < 1) {
                throw new InvalidInputException('Company name must be at least 1 character long.');
            }
        }
    }
}

export class CompanyId extends EntityId<'CompanyId'> {
    static from(value: string): CompanyId {
        return new CompanyId(value);
    }

    static generate(): CompanyId {
        return new CompanyId();
    }
}
