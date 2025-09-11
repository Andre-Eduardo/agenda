import type {CreateEntity, EntityJson, EntityProps} from '../../@shared/entity';
import {Person, PersonId, PersonProfile} from '../../person/entities';
import {SupplierChangedEvent, SupplierCreatedEvent, SupplierDeletedEvent} from '../events';

export type SupplierProps = EntityProps<Supplier>;
export type CreateSupplier = Omit<CreateEntity<Supplier>, 'profiles'>;
export type UpdateSupplier = Omit<Partial<SupplierProps>, 'companyId'>;

export class Supplier extends Person {
    static create(props: CreateSupplier): Supplier {
        const now = new Date();
        const supplier = new Supplier({
            ...props,
            id: PersonId.generate(),
            companyName: props.companyName ?? null,
            phone: props.phone ?? null,
            gender: props.gender ?? null,
            profiles: new Set([PersonProfile.SUPPLIER]),
            createdAt: now,
            updatedAt: now,
        });

        supplier.addEvent(new SupplierCreatedEvent({companyId: props.companyId, supplier, timestamp: now}));

        return supplier;
    }

    static createFromPerson(person: Person): Supplier {
        const now = new Date();
        const supplier = new Supplier({
            ...person,
            profiles: new Set([...person.profiles, PersonProfile.SUPPLIER]),
            createdAt: now,
            updatedAt: now,
        });

        supplier.addEvent(new SupplierCreatedEvent({companyId: person.companyId, supplier, timestamp: now}));

        return supplier;
    }

    change(props: UpdateSupplier): void {
        const oldSupplier = new Supplier(this);

        super.change(props);

        this.addEvent(new SupplierChangedEvent({companyId: this.companyId, oldState: oldSupplier, newState: this}));
    }

    delete(): void {
        this.profiles.delete(PersonProfile.SUPPLIER);
        this.addEvent(new SupplierDeletedEvent({companyId: this.companyId, supplier: this}));
    }

    toJSON(): EntityJson<Supplier> {
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
