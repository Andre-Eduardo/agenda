import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {PreconditionException, ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import {DocumentId} from '../../../../domain/@shared/value-objects';
import type {CustomerRepository} from '../../../../domain/customer/customer.repository';
import {fakeCustomer} from '../../../../domain/customer/entities/__tests__/fake-customer';
import {CustomerChangedEvent} from '../../../../domain/customer/events';
import type {EventDispatcher} from '../../../../domain/event';
import {PersonId} from '../../../../domain/person/entities';
import {DuplicateDocumentIdException} from '../../../../domain/person/person.exceptions';
import {UserId} from '../../../../domain/user/entities';
import {CustomerDto, type UpdateCustomerDto} from '../../dtos';
import {UpdateCustomerService} from '../update-customer.service';

describe('An update-customer service', () => {
    const customerRepository = mock<CustomerRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const updateCustomerService = new UpdateCustomerService(customerRepository, eventDispatcher);

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

    it('should update a customer', async () => {
        const existingCustomer = fakeCustomer();

        const oldCustomer = fakeCustomer(existingCustomer);

        const payload: UpdateCustomerDto = {
            id: existingCustomer.id,
            name: 'New name',
        };

        jest.spyOn(customerRepository, 'findById').mockResolvedValueOnce(existingCustomer);

        const updatedCustomer = fakeCustomer({
            ...existingCustomer,
            ...payload,
            updatedAt: now,
        });

        await expect(updateCustomerService.execute({actor, payload})).resolves.toEqual(
            new CustomerDto(updatedCustomer)
        );

        expect(existingCustomer.name).toBe(payload.name);
        expect(existingCustomer.updatedAt).toEqual(now);
        expect(existingCustomer.events).toHaveLength(1);
        expect(existingCustomer.events[0]).toBeInstanceOf(CustomerChangedEvent);
        expect(existingCustomer.events).toEqual([
            {
                type: CustomerChangedEvent.type,
                companyId: existingCustomer.companyId,
                timestamp: now,
                oldState: oldCustomer,
                newState: existingCustomer,
            },
        ]);
        expect(customerRepository.save).toHaveBeenCalledWith(existingCustomer);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingCustomer);
    });

    it('should fail to update a customer with a document ID already in use', async () => {
        const existingCustomer = fakeCustomer({
            documentId: DocumentId.create('12345678901'),
        });

        const payload: UpdateCustomerDto = {
            id: existingCustomer.id,
            name: 'customer name',
            documentId: DocumentId.create('12345678901'),
        };

        jest.spyOn(customerRepository, 'findById').mockResolvedValueOnce(existingCustomer);
        jest.spyOn(customerRepository, 'save').mockRejectedValue(
            new DuplicateDocumentIdException('Duplicate customer document ID.')
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
        await expect(updateCustomerService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot update a customer with a document ID already in use.'
        );
    });

    it('should throw an error when failing to update the customer', async () => {
        const existingCustomer = fakeCustomer();

        const payload: UpdateCustomerDto = {
            id: existingCustomer.id,
            name: 'customer name',
            documentId: DocumentId.create('12345678901'),
        };

        jest.spyOn(customerRepository, 'findById').mockResolvedValueOnce(existingCustomer);
        jest.spyOn(customerRepository, 'save').mockRejectedValue(new Error('generic error'));

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
        await expect(updateCustomerService.execute({actor, payload})).rejects.toThrowWithMessage(
            Error,
            'generic error'
        );
    });

    it('should throw an error when the customer does not exist', async () => {
        const payload: UpdateCustomerDto = {
            id: PersonId.generate(),
            name: 'New name',
        };

        jest.spyOn(customerRepository, 'findById').mockResolvedValueOnce(null);

        await expect(updateCustomerService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Customer not found'
        );
    });
});
