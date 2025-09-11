import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {CompanyRepository} from '../../../../domain/company/company.repository';
import {CompanyId} from '../../../../domain/company/entities';
import {fakeCompany} from '../../../../domain/company/entities/__tests__/fake-company';
import {UserId} from '../../../../domain/user/entities';
import type {GetCompanyDto} from '../../dtos';
import {CompanyDto} from '../../dtos';
import {GetCompanyService} from '../index';

describe('A get-company service', () => {
    const companyRepository = mock<CompanyRepository>();
    const getCompanyService = new GetCompanyService(companyRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should get a company', async () => {
        const existingCompany = fakeCompany();

        const payload: GetCompanyDto = {
            id: existingCompany.id,
        };

        jest.spyOn(companyRepository, 'findById').mockResolvedValueOnce(existingCompany);

        await expect(getCompanyService.execute({actor, payload})).resolves.toEqual(new CompanyDto(existingCompany));

        expect(existingCompany.events).toHaveLength(0);

        expect(companyRepository.findById).toHaveBeenCalledWith(payload.id);
    });

    it('should throw an error when the company does not exist', async () => {
        const payload: GetCompanyDto = {
            id: CompanyId.generate(),
        };

        jest.spyOn(companyRepository, 'findById').mockResolvedValueOnce(null);

        await expect(getCompanyService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Company not found'
        );
    });
});
