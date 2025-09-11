import type {EntityProps, CreateEntity, EntityJson} from '../../@shared/entity';
import {PersonId, Person, PersonProfile} from '../../person/entities';
import {CustomerChangedEvent, CustomerCreatedEvent, CustomerDeletedEvent} from '../events';

export type CustomerProps = EntityProps<Customer>;
export type CreateCustomer = Omit<CreateEntity<Customer>, 'profiles'>;
export type UpdateCustomer = Omit<Partial<CustomerProps>, 'companyId'>;

export class Customer extends Person {
    static create(props: CreateCustomer): Customer {
        const now = new Date();
        const customer = new Customer({
            ...props,
            id: PersonId.generate(),
            companyName: props.companyName ?? null,
            phone: props.phone ?? null,
            gender: props.gender ?? null,
            profiles: new Set([PersonProfile.CUSTOMER]),
            createdAt: now,
            updatedAt: now,
        });

        customer.addEvent(new CustomerCreatedEvent({companyId: props.companyId, customer, timestamp: now}));

        return customer;
    }

    static createFromPerson(person: Person): Customer {
        const now = new Date();
        const customer = new Customer({
            ...person,
            profiles: new Set([...person.profiles, PersonProfile.CUSTOMER]),
            createdAt: now,
            updatedAt: now,
        });

        customer.addEvent(new CustomerCreatedEvent({companyId: person.companyId, customer, timestamp: now}));

        return customer;
    }

    change(props: UpdateCustomer): void {
        const oldCustomer = new Customer(this);

        super.change(props);

        this.addEvent(new CustomerChangedEvent({companyId: this.companyId, oldState: oldCustomer, newState: this}));
    }

    delete(): void {
        this.profiles.delete(PersonProfile.CUSTOMER);
        this.addEvent(new CustomerDeletedEvent({companyId: this.companyId, customer: this}));
    }

    toJSON(): EntityJson<Customer> {
        return {
            id: this.id.toJSON(),
            companyId: this.companyId.toJSON(),
            gender: this.gender,
            documentId: this.documentId.toJSON(),
            phone: this.phone?.toJSON() ?? null,
            name: this.name,
            companyName: this.companyName,
            profiles: Array.from(this.profiles),
            personType: this.personType,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
        };
    }
}
