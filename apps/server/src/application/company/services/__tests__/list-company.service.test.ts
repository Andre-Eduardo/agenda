import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import type {CompanyRepository} from '../../../../domain/company/company.repository';
import type {Company} from '../../../../domain/company/entities';
import {fakeCompany} from '../../../../domain/company/entities/__tests__/fake-company';
import {UserId} from '../../../../domain/user/entities';
import type {ListCompanyDto} from '../../dtos';
import {CompanyDto} from '../../dtos';
import {ListCompanyService} from '../index';

describe('A list-company service', () => {
    const companyRepository = mock<CompanyRepository>();
    const listCompanyService = new ListCompanyService(companyRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const existingCompanies = [fakeCompany({name: 'Company 1'}), fakeCompany({name: 'Company 2'})];

    it('should list companies', async () => {
        const paginatedCompanies: PaginatedList<Company> = {
            data: existingCompanies,
            totalCount: existingCompanies.length,
            nextCursor: null,
        };

        const payload: ListCompanyDto = {
            name: 'Company',
            pagination: {
                limit: 2,
                sort: {name: 'asc'},
            },
        };

        jest.spyOn(companyRepository, 'search').mockResolvedValueOnce(paginatedCompanies);

        await expect(listCompanyService.execute({actor, payload})).resolves.toEqual({
            data: existingCompanies.map((company) => new CompanyDto(company)),
            totalCount: existingCompanies.length,
            nextCursor: null,
        });

        expect(existingCompanies.flatMap((company) => company.events)).toHaveLength(0);

        expect(companyRepository.search).toHaveBeenCalledWith(
            {
                limit: 2,
                sort: {name: 'asc'},
            },
            {
                name: 'Company',
            }
        );
    });

    it('should paginate companies', async () => {
        const paginatedCompanies: PaginatedList<Company> = {
            data: existingCompanies,
            totalCount: existingCompanies.length,
            nextCursor: null,
        };

        const payload: ListCompanyDto = {
            name: 'Company',
            pagination: {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
            },
        };

        jest.spyOn(companyRepository, 'search').mockResolvedValueOnce(paginatedCompanies);

        await expect(listCompanyService.execute({actor, payload})).resolves.toEqual({
            data: existingCompanies.map((company) => new CompanyDto(company)),
            totalCount: existingCompanies.length,
            nextCursor: null,
        });

        expect(existingCompanies.flatMap((company) => company.events)).toHaveLength(0);

        expect(companyRepository.search).toHaveBeenCalledWith(
            {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
                sort: {},
            },
            {
                name: 'Company',
            }
        );
    });
});
