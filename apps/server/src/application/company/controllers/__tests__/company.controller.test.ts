import type {Response} from 'express';
import {mock, mockDeep} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {Company, CompanyId} from '../../../../domain/company/entities';
import {UserId} from '../../../../domain/user/entities';
import {TokenScope} from '../../../../domain/user/token';
import {JsonWebToken} from '../../../../infrastructure/auth/jwt';
import type {PaginatedDto} from '../../../@shared/dto';
import {CompanyDto} from '../../dtos';
import type {
    ListCompanyService,
    DeleteCompanyService,
    GetCompanyService,
    CreateCompanyService,
    UpdateCompanyService,
} from '../../services';
import {CompanyController} from '../index';

describe('A company controller', () => {
    const createCompanyServiceMock = mock<CreateCompanyService>();
    const listCompanyServiceMock = mock<ListCompanyService>();
    const getCompanyServiceMock = mock<GetCompanyService>();
    const updateCompanyServiceMock = mock<UpdateCompanyService>();
    const deleteCompanyServiceMock = mock<DeleteCompanyService>();
    const companyController = new CompanyController(
        createCompanyServiceMock,
        listCompanyServiceMock,
        getCompanyServiceMock,
        updateCompanyServiceMock,
        deleteCompanyServiceMock
    );

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    describe('when creating a company', () => {
        it('should repass the responsibility to the right service', async () => {
            const response = mockDeep<Response>();
            const payload = {
                name: 'My Company',
            };
            const token = JsonWebToken.signed(
                {
                    userId: UserId.generate(),
                    companies: [CompanyId.generate(), CompanyId.generate()],
                    issueTime: new Date(),
                    expirationTime: new Date(),
                    scope: [TokenScope.AUTH],
                },
                'secret'
            );

            const expectedCompany = new CompanyDto(Company.create(payload));

            jest.spyOn(createCompanyServiceMock, 'execute').mockResolvedValueOnce({
                token,
                company: expectedCompany,
            });

            await expect(companyController.createCompany(actor, payload, response)).resolves.toEqual(expectedCompany);

            expect(createCompanyServiceMock.execute).toHaveBeenCalledWith({actor, payload});

            expect(response.actions.setToken).toHaveBeenCalledWith(token);
            expect(response.actions.setCompany).not.toHaveBeenCalled();
        });

        it('should make the first company the current company to operate', async () => {
            const response = mockDeep<Response>();
            const payload = {
                name: 'My Company',
            };
            const token = JsonWebToken.signed(
                {
                    userId: UserId.generate(),
                    companies: [CompanyId.generate()],
                    issueTime: new Date(),
                    expirationTime: new Date(),
                    scope: [TokenScope.AUTH],
                },
                'secret'
            );

            const expectedCompany = new CompanyDto(Company.create(payload));

            jest.spyOn(createCompanyServiceMock, 'execute').mockResolvedValueOnce({
                token,
                company: expectedCompany,
            });

            await expect(companyController.createCompany(actor, payload, response)).resolves.toEqual(expectedCompany);

            expect(createCompanyServiceMock.execute).toHaveBeenCalledWith({actor, payload});

            expect(response.actions.setToken).toHaveBeenCalledWith(token);
            expect(response.actions.setCompany).toHaveBeenCalledWith(token.companies[0]);
        });
    });

    describe('when listing companies', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload = {
                name: 'Company',
                pagination: {
                    limit: 10,
                },
            };
            const companies = [Company.create({name: 'Company 1'}), Company.create({name: 'Company 2'})];
            const expectedResult: PaginatedDto<CompanyDto> = {
                data: companies.map((company) => new CompanyDto(company)),
                totalCount: 2,
                nextCursor: null,
            };

            jest.spyOn(listCompanyServiceMock, 'execute').mockResolvedValueOnce(expectedResult);

            await expect(companyController.listCompany(actor, payload)).resolves.toEqual(expectedResult);

            expect(listCompanyServiceMock.execute).toHaveBeenCalledWith({actor, payload});
        });
    });

    describe('when getting a company', () => {
        it('should repass the responsibility to the right service', async () => {
            const company = Company.create({name: 'My Company'});

            const expectedCompany = new CompanyDto(company);

            jest.spyOn(getCompanyServiceMock, 'execute').mockResolvedValueOnce(expectedCompany);

            await expect(companyController.getCompany(actor, company.id)).resolves.toEqual(expectedCompany);

            expect(getCompanyServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id: company.id}});
        });
    });

    describe('when updating a company', () => {
        it('should repass the responsibility to the right service', async () => {
            const existingCompany = Company.create({name: 'My Company'});
            const payload = {
                name: 'My new Company',
            };

            const expectedCompany = new CompanyDto(existingCompany);

            jest.spyOn(updateCompanyServiceMock, 'execute').mockResolvedValueOnce(expectedCompany);

            await expect(companyController.updateCompany(actor, existingCompany.id, payload)).resolves.toEqual(
                expectedCompany
            );

            expect(updateCompanyServiceMock.execute).toHaveBeenCalledWith({
                actor,
                payload: {id: existingCompany.id, ...payload},
            });
        });
    });

    describe('when deleting a company', () => {
        it('should repass the responsibility to the right service', async () => {
            const id = CompanyId.generate();

            await companyController.deleteCompany(actor, id);

            expect(deleteCompanyServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id}});
        });
    });
});
