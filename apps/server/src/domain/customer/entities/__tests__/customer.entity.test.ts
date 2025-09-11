import {DocumentId, Phone} from '../../../@shared/value-objects';
import {CompanyId} from '../../../company/entities';
import {Gender, PersonProfile, PersonType} from '../../../person/entities';
import {fakePerson} from '../../../person/entities/__tests__/fake-person';
import {CustomerChangedEvent, CustomerCreatedEvent, CustomerDeletedEvent} from '../../events';
import {Customer} from '../customer.entity';
import {fakeCustomer} from './fake-customer';

describe('A customer', () => {
    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('on creation', () => {
        it('should emit a customer-created event', () => {
            const customer = Customer.create({
                name: 'user',
                companyName: 'company',
                personType: PersonType.LEGAL,
                documentId: DocumentId.create('12345678901'),
                companyId: CompanyId.generate(),
                phone: Phone.create('12345678901'),
            });

            expect(customer.name).toBe('user');
            expect(customer.companyName).toBe('company');
            expect(customer.personType).toBe(PersonType.LEGAL);
            expect(customer.documentId.toString()).toBe('12345678901');
            expect(customer.phone!.toString()).toBe('12345678901');
            expect(customer.profiles).toEqual(new Set([PersonProfile.CUSTOMER]));

            expect(customer.events).toEqual([
                {
                    type: CustomerCreatedEvent.type,
                    companyId: customer.companyId,
                    timestamp: now,
                    customer,
                },
            ]);
            expect(customer.events[0]).toBeInstanceOf(CustomerCreatedEvent);
        });

        it('can be created from a person', () => {
            const person = fakePerson();

            const customer = Customer.createFromPerson(person);

            expect(customer.name).toBe(person.name);
            expect(customer.companyName).toBe(person.companyName);
            expect(customer.personType).toBe(person.personType);
            expect(customer.documentId).toBe(person.documentId);
            expect(customer.companyId).toBe(person.companyId);
            expect(customer.phone).toBe(person.phone);
            expect(customer.profiles).toEqual(new Set([...person.profiles, PersonProfile.CUSTOMER]));

            expect(customer.events).toEqual([
                {
                    type: CustomerCreatedEvent.type,
                    companyId: customer.companyId,
                    timestamp: now,
                    customer,
                },
            ]);
            expect(customer.events[0]).toBeInstanceOf(CustomerCreatedEvent);
        });
    });

    describe('on change', () => {
        it('should emit a customer-changed event', () => {
            const customer = fakeCustomer();

            const oldCustomer = fakeCustomer(customer);

            customer.change({
                name: 'new customer',
                personType: PersonType.LEGAL,
                companyName: 'new company',
                profiles: customer.profiles.add(PersonProfile.EMPLOYEE),
                documentId: DocumentId.create('12345678111'),
                phone: Phone.create('12345678'),
            });

            expect(customer.name).toBe('new customer');
            expect(customer.documentId.toString()).toBe('12345678111');
            expect(customer.phone!.toString()).toBe('12345678');
            expect(customer.companyName).toBe('new company');
            expect(customer.personType).toBe(PersonType.LEGAL);
            expect(customer.profiles).toEqual(new Set([PersonProfile.CUSTOMER, PersonProfile.EMPLOYEE]));

            expect(customer.events).toEqual([
                {
                    type: CustomerChangedEvent.type,
                    timestamp: now,
                    companyId: customer.companyId,
                    oldState: oldCustomer,
                    newState: customer,
                },
            ]);
            expect(customer.events[0]).toBeInstanceOf(CustomerChangedEvent);
        });
    });

    describe('on deletion', () => {
        it('should emit a customer-deleted event', () => {
            const customer = fakeCustomer();

            customer.delete();

            expect(customer.events).toEqual([
                {
                    type: CustomerDeletedEvent.type,
                    timestamp: now,
                    companyId: customer.companyId,
                    customer,
                },
            ]);
            expect(customer.events[0]).toBeInstanceOf(CustomerDeletedEvent);
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
        const customer = fakeCustomer({
            ...values,
            name: 'john',
        });

        expect(customer.toJSON()).toEqual({
            id: customer.id.toJSON(),
            name: 'john',
            companyName: customer.companyName,
            companyId: customer.companyId.toJSON(),
            profiles: ['CUSTOMER'],
            personType: customer.personType,
            documentId: '12345678901',
            phone: expectedPhone,
            gender: customer.gender,
            createdAt: customer.createdAt.toJSON(),
            updatedAt: customer.updatedAt.toJSON(),
        });
    });
});
