import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {CustomerRepository} from '../../../../domain/customer/customer.repository';
import {fakeCustomer} from '../../../../domain/customer/entities/__tests__/fake-customer';
import {PersonId} from '../../../../domain/person/entities';
import {UserId} from '../../../../domain/user/entities';
import type {GetCustomerDto} from '../../dtos';
import {CustomerDto} from '../../dtos';
import {GetCustomerService} from '../get-customer.service';

describe('A get-customer service', () => {
    const customerRepository = mock<CustomerRepository>();
    const getCustomerService = new GetCustomerService(customerRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should get a customer', async () => {
        const existingCustomer = fakeCustomer();

        const payload: GetCustomerDto = {
            id: existingCustomer.id,
        };

        jest.spyOn(customerRepository, 'findById').mockResolvedValueOnce(existingCustomer);

        await expect(getCustomerService.execute({actor, payload})).resolves.toEqual(new CustomerDto(existingCustomer));

        expect(existingCustomer.events).toHaveLength(0);

        expect(customerRepository.findById).toHaveBeenCalledWith(payload.id);
    });

    it('should throw an error when the customer does not exist', async () => {
        const payload: GetCustomerDto = {
            id: PersonId.generate(),
        };

        jest.spyOn(customerRepository, 'findById').mockResolvedValueOnce(null);

        await expect(getCustomerService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Customer not found'
        );
    });
});
