import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import {CompanyId} from '../../../../domain/company/entities';
import type {CustomerRepository} from '../../../../domain/customer/customer.repository';
import type {Customer} from '../../../../domain/customer/entities';
import {fakeCustomer} from '../../../../domain/customer/entities/__tests__/fake-customer';
import {UserId} from '../../../../domain/user/entities';
import type {ListCustomerDto} from '../../dtos';
import {CustomerDto} from '../../dtos';
import {ListCustomerService} from '../list-customer.service';

describe('A list-customer service', () => {
    const customerRepository = mock<CustomerRepository>();
    const listCustomerService = new ListCustomerService(customerRepository);
    const companyId = CompanyId.generate();

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const existingCustomer = [
        fakeCustomer({
            name: 'My name',
            companyId,
        }),
        fakeCustomer({
            name: 'My name2',
            companyId,
        }),
    ];

    it('should list customers', async () => {
        const paginatedCustomers: PaginatedList<Customer> = {
            data: existingCustomer,
            totalCount: existingCustomer.length,
            nextCursor: null,
        };

        const payload: ListCustomerDto = {
            companyId,
            pagination: {
                limit: 2,
                sort: {name: 'asc'},
            },
            name: 'name',
        };

        jest.spyOn(customerRepository, 'search').mockResolvedValueOnce(paginatedCustomers);

        await expect(listCustomerService.execute({actor, payload})).resolves.toEqual({
            data: existingCustomer.map((customer) => new CustomerDto(customer)),
            totalCount: existingCustomer.length,
            nextCursor: null,
        });
        expect(existingCustomer.flatMap((customer) => customer.events)).toHaveLength(0);
        expect(customerRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                limit: 2,
                sort: {name: 'asc'},
            },
            {
                name: 'name',
            }
        );
    });

    it('should paginate customers', async () => {
        const paginatedCustomers: PaginatedList<Customer> = {
            data: existingCustomer,
            totalCount: existingCustomer.length,
            nextCursor: null,
        };
        const payload: ListCustomerDto = {
            companyId,
            name: 'name',
            pagination: {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
            },
        };

        jest.spyOn(customerRepository, 'search').mockResolvedValueOnce(paginatedCustomers);

        await expect(listCustomerService.execute({actor, payload})).resolves.toEqual({
            data: existingCustomer.map((customer) => new CustomerDto(customer)),
            totalCount: existingCustomer.length,
            nextCursor: null,
        });
        expect(existingCustomer.flatMap((customer) => customer.events)).toHaveLength(0);
        expect(customerRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
                sort: {},
            },
            {
                name: 'name',
            }
        );
    });
});
