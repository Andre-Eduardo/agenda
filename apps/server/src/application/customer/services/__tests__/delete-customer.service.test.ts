import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {CustomerRepository} from '../../../../domain/customer/customer.repository';
import {fakeCustomer} from '../../../../domain/customer/entities/__tests__/fake-customer';
import {CustomerDeletedEvent} from '../../../../domain/customer/events';
import type {EventDispatcher} from '../../../../domain/event';
import {PersonId, PersonProfile} from '../../../../domain/person/entities';
import {fakePerson} from '../../../../domain/person/entities/__tests__/fake-person';
import type {PersonRepository} from '../../../../domain/person/person.repository';
import {UserId} from '../../../../domain/user/entities';
import type {DeleteCustomerDto} from '../../dtos';
import {DeleteCustomerService} from '../delete-customer.service';

describe('A delete-customer service', () => {
    const customerRepository = mock<CustomerRepository>();
    const personRepository = mock<PersonRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const deleteCustomerService = new DeleteCustomerService(personRepository, customerRepository, eventDispatcher);

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

    const existingPerson = fakePerson();

    it('should delete a customer', async () => {
        const existingCustomer = fakeCustomer({
            ...existingPerson,
            profiles: new Set([PersonProfile.CUSTOMER, PersonProfile.EMPLOYEE]),
            createdAt: now,
            updatedAt: now,
        });
        const payload: DeleteCustomerDto = {
            id: existingCustomer.id,
        };

        jest.spyOn(customerRepository, 'findById').mockResolvedValueOnce(existingCustomer);

        await deleteCustomerService.execute({actor, payload});

        expect(existingCustomer.events).toHaveLength(1);
        expect(existingCustomer.events[0]).toBeInstanceOf(CustomerDeletedEvent);
        expect(existingCustomer.events).toEqual([
            {
                type: CustomerDeletedEvent.type,
                timestamp: now,
                companyId: existingCustomer.companyId,
                customer: existingCustomer,
            },
        ]);
        expect(customerRepository.save).toHaveBeenCalledWith({
            ...existingCustomer,
            profiles: new Set([PersonProfile.EMPLOYEE]),
        });
        expect(customerRepository.delete).toHaveBeenCalledWith(existingCustomer.id);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingCustomer);
    });

    it('should delete a person who is a customer only', async () => {
        const existingCustomer = fakeCustomer({
            ...existingPerson,
            createdAt: now,
            updatedAt: now,
        });

        const payload: DeleteCustomerDto = {
            id: existingCustomer.id,
        };

        jest.spyOn(customerRepository, 'findById').mockResolvedValueOnce(existingCustomer);

        await deleteCustomerService.execute({actor, payload});

        expect(existingCustomer.events).toHaveLength(1);
        expect(existingCustomer.events[0]).toBeInstanceOf(CustomerDeletedEvent);
        expect(existingCustomer.events).toEqual([
            {
                type: CustomerDeletedEvent.type,
                timestamp: now,
                companyId: existingCustomer.companyId,
                customer: existingCustomer,
            },
        ]);
        expect(customerRepository.save).toHaveBeenCalledWith({
            ...existingCustomer,
            profiles: new Set([]),
        });
        expect(customerRepository.delete).toHaveBeenCalledWith(existingCustomer.id);
        expect(personRepository.delete).toHaveBeenCalledWith(existingCustomer.id);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingCustomer);
    });

    it('should throw an error when the customer does not exist', async () => {
        const personId = PersonId.generate();
        const payload: DeleteCustomerDto = {
            id: personId,
        };

        jest.spyOn(customerRepository, 'findById').mockResolvedValueOnce(null);

        await expect(deleteCustomerService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Customer not found'
        );
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
