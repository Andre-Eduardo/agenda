import {DocumentId, Phone} from '../../../@shared/value-objects';
import {CompanyId} from '../../../company/entities';
import {Gender, PersonProfile, PersonType} from '../../../person/entities';
import {fakePerson} from '../../../person/entities/__tests__/fake-person';
import {SupplierChangedEvent, SupplierCreatedEvent, SupplierDeletedEvent} from '../../events';
import {Supplier} from '../supplier.entity';
import {fakeSupplier} from './fake-supplier';

describe('A supplier', () => {
    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('on creation', () => {
        it('should emit a supplier-created event', () => {
            const supplier = Supplier.create({
                name: 'user',
                companyName: 'company',
                personType: PersonType.LEGAL,
                documentId: DocumentId.create('12345678901'),
                companyId: CompanyId.generate(),
                phone: Phone.create('12345678901'),
            });

            expect(supplier.name).toBe('user');
            expect(supplier.companyName).toBe('company');
            expect(supplier.personType).toBe(PersonType.LEGAL);
            expect(supplier.documentId.toString()).toBe('12345678901');
            expect(supplier.phone!.toString()).toBe('12345678901');
            expect(supplier.profiles).toEqual(new Set([PersonProfile.SUPPLIER]));

            expect(supplier.events).toEqual([
                {
                    type: SupplierCreatedEvent.type,
                    companyId: supplier.companyId,
                    timestamp: now,
                    supplier,
                },
            ]);
            expect(supplier.events[0]).toBeInstanceOf(SupplierCreatedEvent);
        });

        it('can be created from a person', () => {
            const person = fakePerson({
                name: 'user',
                companyName: 'company',
                personType: PersonType.LEGAL,
                profiles: new Set([PersonProfile.EMPLOYEE]),
                documentId: DocumentId.create('12345678901'),
                phone: Phone.create('12345678901'),
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const supplier = Supplier.createFromPerson(person);

            expect(supplier.name).toBe(person.name);
            expect(supplier.companyName).toBe(person.companyName);
            expect(supplier.personType).toBe(person.personType);
            expect(supplier.documentId).toBe(person.documentId);
            expect(supplier.companyId).toBe(person.companyId);
            expect(supplier.phone).toBe(person.phone);
            expect(supplier.profiles).toEqual(new Set([...person.profiles, PersonProfile.SUPPLIER]));

            expect(supplier.events).toEqual([
                {
                    type: SupplierCreatedEvent.type,
                    companyId: supplier.companyId,
                    timestamp: now,
                    supplier,
                },
            ]);
            expect(supplier.events[0]).toBeInstanceOf(SupplierCreatedEvent);
        });
    });

    describe('on change', () => {
        it('should emit a supplier-changed event', () => {
            const supplier = fakeSupplier({
                profiles: new Set([PersonProfile.CUSTOMER]),
            });

            const oldSupplier = fakeSupplier(supplier);

            supplier.change({
                name: 'new supplier',

                personType: PersonType.NATURAL,
                profiles: supplier.profiles.add(PersonProfile.SUPPLIER),
                documentId: DocumentId.create('12345678111'),
                phone: Phone.create('12345678'),
                gender: Gender.FEMALE,
            });

            expect(supplier.name).toBe('new supplier');
            expect(supplier.documentId.toString()).toBe('12345678111');
            expect(supplier.phone!.toString()).toBe('12345678');
            expect(supplier.gender).toBe(Gender.FEMALE);
            expect(supplier.personType).toBe(PersonType.NATURAL);
            expect(supplier.profiles).toEqual(new Set([PersonProfile.SUPPLIER, PersonProfile.CUSTOMER]));

            expect(supplier.events).toEqual([
                {
                    type: SupplierChangedEvent.type,
                    timestamp: now,
                    companyId: supplier.companyId,
                    oldState: oldSupplier,
                    newState: supplier,
                },
            ]);
            expect(supplier.events[0]).toBeInstanceOf(SupplierChangedEvent);
        });
    });

    describe('on deletion', () => {
        it('should emit a supplier-deleted event', () => {
            const supplier = fakeSupplier();

            supplier.delete();

            expect(supplier.events).toEqual([
                {
                    type: SupplierDeletedEvent.type,
                    timestamp: now,
                    companyId: supplier.companyId,
                    supplier,
                },
            ]);
            expect(supplier.events[0]).toBeInstanceOf(SupplierDeletedEvent);
        });
    });

    it.each([
        [
            {
                personType: PersonType.LEGAL,
                phone: Phone.create('12345678'),
                companyName: 'company',
            },
            '12345678',
        ],
        [
            {
                personType: PersonType.NATURAL,
                phone: Phone.create('12345678'),
                gender: Gender.MALE,
            },
            '12345678',
        ],
        [
            {
                personType: PersonType.NATURAL,
                phone: null,
                gender: Gender.MALE,
            },
            null,
        ],
    ])('should be serializable', (values, expectedPhone) => {
        const supplier = fakeSupplier({
            ...values,
            name: 'john',
            profiles: new Set([PersonProfile.SUPPLIER]),
            documentId: DocumentId.create('12345678901'),
            companyId: CompanyId.generate(),
        });

        expect(supplier.toJSON()).toEqual({
            id: supplier.id.toJSON(),
            name: 'john',
            companyName: supplier.companyName,
            companyId: supplier.companyId.toJSON(),
            profiles: ['SUPPLIER'],
            personType: supplier.personType,
            documentId: '12345678901',
            phone: expectedPhone,
            gender: supplier.gender,
            createdAt: supplier.createdAt.toJSON(),
            updatedAt: supplier.updatedAt.toJSON(),
        });
    });
});
