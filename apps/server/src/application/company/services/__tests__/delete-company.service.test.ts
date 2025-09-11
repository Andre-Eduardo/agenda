import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {CompanyRepository} from '../../../../domain/company/company.repository';
import {CompanyId} from '../../../../domain/company/entities';
import {fakeCompany} from '../../../../domain/company/entities/__tests__/fake-company';
import {CompanyDeletedEvent} from '../../../../domain/company/events';
import type {EventDispatcher} from '../../../../domain/event';
import {UserId} from '../../../../domain/user/entities';
import type {DeleteCompanyDto} from '../../dtos';
import {DeleteCompanyService} from '../index';

describe('A delete-company service', () => {
    const companyRepository = mock<CompanyRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const deleteCompanyService = new DeleteCompanyService(companyRepository, eventDispatcher);

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

    it('should delete a company', async () => {
        const existingCompany = fakeCompany();

        const payload: DeleteCompanyDto = {
            id: existingCompany.id,
        };

        jest.spyOn(companyRepository, 'findById').mockResolvedValueOnce(existingCompany);

        await deleteCompanyService.execute({actor, payload});

        expect(existingCompany.events).toHaveLength(1);
        expect(existingCompany.events[0]).toBeInstanceOf(CompanyDeletedEvent);
        expect(existingCompany.events).toEqual([
            {
                type: CompanyDeletedEvent.type,
                timestamp: now,
                companyId: existingCompany.id,
                company: existingCompany,
            },
        ]);

        expect(companyRepository.delete).toHaveBeenCalledWith(existingCompany.id);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingCompany);
    });

    it('should throw an error when the company does not exist', async () => {
        const payload: DeleteCompanyDto = {
            id: CompanyId.generate(),
        };

        jest.spyOn(companyRepository, 'findById').mockResolvedValueOnce(null);

        await expect(deleteCompanyService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Company not found'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
