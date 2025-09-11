import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {DocumentId, Phone} from '../../../../domain/@shared/value-objects';
import {CompanyId} from '../../../../domain/company/entities';
import {Customer} from '../../../../domain/customer/entities';
import {Gender, PersonProfile, PersonType} from '../../../../domain/person/entities';
import {UserId} from '../../../../domain/user/entities';
import type {PaginatedDto} from '../../../@shared/dto';
import {CustomerDto} from '../../dtos';
import type {
    CreateCustomerService,
    ListCustomerService,
    DeleteCustomerService,
    GetCustomerService,
    UpdateCustomerService,
} from '../../services';
import {CustomerController} from '../index';

describe('A customer controller', () => {
    const createCustomerServiceMock = mock<CreateCustomerService>();
    const getCustomerServiceMock = mock<GetCustomerService>();
    const listCustomerServiceMock = mock<ListCustomerService>();
    const deleteCustomerServiceMock = mock<DeleteCustomerService>();
    const updateCustomerServiceMock = mock<UpdateCustomerService>();
    const customerController = new CustomerController(
        createCustomerServiceMock,
        listCustomerServiceMock,
        getCustomerServiceMock,
        updateCustomerServiceMock,
        deleteCustomerServiceMock
    );

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    describe('when creating a customer', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload = {
                name: 'name',
                companyId: CompanyId.generate(),
                phone: Phone.create('61999999999'),
                companyName: null,
                personType: PersonType.NATURAL,
                documentId: DocumentId.create('15785065178'),
                gender: Gender.MALE,
            };

            const expectedCustomer = new CustomerDto(Customer.create(payload));

            jest.spyOn(createCustomerServiceMock, 'execute').mockResolvedValueOnce(expectedCustomer);

            await expect(customerController.createCustomer(actor, payload)).resolves.toEqual(expectedCustomer);

            expect(createCustomerServiceMock.execute).toHaveBeenCalledWith({actor, payload});
            expect(getCustomerServiceMock.execute).not.toHaveBeenCalled();
            expect(listCustomerServiceMock.execute).not.toHaveBeenCalled();
            expect(deleteCustomerServiceMock.execute).not.toHaveBeenCalled();
        });
    });

    describe('when getting a customer', () => {
        it('should repass the responsibility to the right service', async () => {
            const customer = Customer.create({
                name: 'name',
                documentId: DocumentId.create('15785065178'),
                companyId: CompanyId.generate(),
                companyName: null,
                personType: PersonType.NATURAL,
                phone: Phone.create('61999999999'),
                gender: Gender.MALE,
            });

            const expectedCustomer = new CustomerDto(customer);

            jest.spyOn(getCustomerServiceMock, 'execute').mockResolvedValueOnce(expectedCustomer);

            await expect(customerController.getCustomer(actor, customer.id)).resolves.toEqual(expectedCustomer);

            expect(getCustomerServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id: customer.id}});
        });
    });

    describe('when listing customer', () => {
        it('should repass the responsibility to the right service', async () => {
            const companyId = CompanyId.generate();
            const values = [
                {
                    name: 'name',
                    documentId: DocumentId.create('15785065178'),
                    companyId,
                    companyName: null,
                    profiles: [PersonProfile.EMPLOYEE],
                    personType: PersonType.NATURAL,
                    phone: Phone.create('61999999999'),
                    gender: Gender.MALE,
                },
                {
                    name: 'name 2',
                    documentId: DocumentId.create('15785065111'),
                    companyId,
                    companyName: null,
                    profiles: [PersonProfile.EMPLOYEE],
                    personType: PersonType.NATURAL,
                    phone: Phone.create('61999999999'),
                    gender: Gender.MALE,
                },
            ];
            const payload = {
                companyId,
                name: 'name',
                pagination: {
                    limit: 10,
                },
            };
            const customers = [Customer.create(values[0]), Customer.create(values[1])];
            const expectedResult: PaginatedDto<CustomerDto> = {
                data: customers.map((customer) => new CustomerDto(customer)),
                totalCount: 2,
                nextCursor: null,
            };

            jest.spyOn(listCustomerServiceMock, 'execute').mockResolvedValueOnce(expectedResult);

            await expect(customerController.listCustomer(actor, payload)).resolves.toEqual(expectedResult);

            expect(listCustomerServiceMock.execute).toHaveBeenCalledWith({actor, payload});
        });
    });

    describe('when updating a customer', () => {
        it('should repass the responsibility to the right service', async () => {
            const existingCustomer = Customer.create({
                name: 'name',
                documentId: DocumentId.create('15785065178'),
                companyId: CompanyId.generate(),
                personType: PersonType.NATURAL,
                phone: Phone.create('61999999999'),
            });
            const payload = {
                name: 'name',
            };

            const expectedCustomer = new CustomerDto(existingCustomer);

            jest.spyOn(updateCustomerServiceMock, 'execute').mockResolvedValueOnce(expectedCustomer);

            await expect(customerController.updateCustomer(actor, existingCustomer.id, payload)).resolves.toEqual(
                expectedCustomer
            );

            expect(updateCustomerServiceMock.execute).toHaveBeenCalledWith({
                actor,
                payload: {id: existingCustomer.id, ...payload},
            });
        });
    });

    describe('when delete a customer', () => {
        it('should repass the responsibility to the right service', async () => {
            const customer = Customer.create({
                name: 'name',
                documentId: DocumentId.create('15785065178'),
                companyId: CompanyId.generate(),
                companyName: null,
                personType: PersonType.NATURAL,
                phone: Phone.create('61999999999'),
                gender: Gender.MALE,
            });

            await customerController.deleteCustomer(actor, customer.id);

            expect(createCustomerServiceMock.execute).not.toHaveBeenCalled();
            expect(getCustomerServiceMock.execute).not.toHaveBeenCalled();
            expect(listCustomerServiceMock.execute).not.toHaveBeenCalled();
            expect(deleteCustomerServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id: customer.id}});
        });
    });
});
