import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {PreconditionException} from '../../../../domain/@shared/exceptions';
import {DocumentId, Phone} from '../../../../domain/@shared/value-objects';
import {CompanyId} from '../../../../domain/company/entities';
import type {CustomerRepository} from '../../../../domain/customer/customer.repository';
import {Customer} from '../../../../domain/customer/entities';
import {CustomerCreatedEvent} from '../../../../domain/customer/events';
import type {EventDispatcher} from '../../../../domain/event';
import {PersonId, PersonProfile, PersonType} from '../../../../domain/person/entities';
import {fakePerson} from '../../../../domain/person/entities/__tests__/fake-person';
import {DuplicateDocumentIdException} from '../../../../domain/person/person.exceptions';
import type {PersonRepository} from '../../../../domain/person/person.repository';
import {UserId} from '../../../../domain/user/entities';
import {type CreateCustomerDto, CustomerDto} from '../../dtos';
import {CreateCustomerService} from '../index';

describe('A create-customer service', () => {
    const personRepository = mock<PersonRepository>();
    const customerRepository = mock<CustomerRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const createCustomerService = new CreateCustomerService(personRepository, customerRepository, eventDispatcher);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should create a customer', async () => {
        const payload: CreateCustomerDto = {
            name: 'customer name',
            documentId: DocumentId.create('12345678901'),
            companyId: CompanyId.generate(),
            personType: PersonType.LEGAL,
            phone: Phone.create('12345678901'),
        };

        const customer = Customer.create(payload);

        jest.spyOn(Customer, 'create').mockReturnValue(customer);

        await expect(createCustomerService.execute({actor, payload})).resolves.toEqual(new CustomerDto(customer));

        expect(customer.events[0]).toBeInstanceOf(CustomerCreatedEvent);
        expect(customer.events).toEqual([
            {
                type: CustomerCreatedEvent.type,
                timestamp: now,
                companyId: customer.companyId,
                customer,
            },
        ]);

        expect(Customer.create).toHaveBeenCalledWith(payload);
        expect(customerRepository.save).toHaveBeenCalledWith(customer);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, customer);
    });

    it('should create a customer from an existing person', async () => {
        const personId = PersonId.generate();
        const payload: CreateCustomerDto = {
            id: personId,
        };
        const person = fakePerson({
            id: personId,
        });

        const customer = Customer.createFromPerson(person);

        jest.spyOn(personRepository, 'findById').mockResolvedValueOnce(person);
        jest.spyOn(Customer, 'createFromPerson').mockReturnValue(customer);

        await expect(createCustomerService.execute({actor, payload})).resolves.toEqual(new CustomerDto(customer));

        expect(customerRepository.save).toHaveBeenCalledWith(customer);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, customer);
    });

    it('should fail to create a customer from a person that is already a customer', async () => {
        const personId = PersonId.generate();
        const payload: CreateCustomerDto = {
            id: personId,
        };
        const existingPerson = fakePerson({
            id: personId,
            profiles: new Set([PersonProfile.CUSTOMER]),
        });

        jest.spyOn(personRepository, 'findById').mockResolvedValueOnce(existingPerson);

        await expect(createCustomerService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'The person is already a customer.'
        );
    });

    it('should fail to create a customer from a person that does not exist', async () => {
        const payload: CreateCustomerDto = {
            id: PersonId.generate(),
        };

        jest.spyOn(personRepository, 'findById').mockResolvedValueOnce(null);

        await expect(createCustomerService.execute({actor, payload})).rejects.toThrowWithMessage(
            Error,
            'Person not found'
        );
    });

    it('should fail to create a customer with a duplicate document ID', async () => {
        const payload: CreateCustomerDto = {
            name: 'customer name',
            documentId: DocumentId.create('12345678901'),
            companyId: CompanyId.generate(),
            personType: PersonType.LEGAL,
            phone: Phone.create('12345678901'),
        };

        jest.spyOn(customerRepository, 'save').mockRejectedValue(
            new DuplicateDocumentIdException('Duplicate customer document ID.')
        );

        await expect(createCustomerService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot create a customer with a document ID already in use.'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error when failing to save the customer', async () => {
        const payload: CreateCustomerDto = {
            name: 'customer name',
            documentId: DocumentId.create('12345678901'),
            companyId: CompanyId.generate(),
            personType: PersonType.LEGAL,
            phone: Phone.create('12345678901'),
        };

        jest.spyOn(customerRepository, 'save').mockRejectedValue(new Error('generic error'));

        await expect(createCustomerService.execute({actor, payload})).rejects.toThrowWithMessage(
            Error,
            'generic error'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
