import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {CompanyRepository} from '../../../../domain/company/company.repository';
import {CompanyId} from '../../../../domain/company/entities';
import {fakeCompany} from '../../../../domain/company/entities/__tests__/fake-company';
import {CompanyChangedEvent} from '../../../../domain/company/events';
import type {EventDispatcher} from '../../../../domain/event';
import {UserId} from '../../../../domain/user/entities';
import type {UpdateCompanyDto} from '../../dtos';
import {CompanyDto} from '../../dtos';
import {UpdateCompanyService} from '../index';

describe('A update-company service', () => {
    const companyRepository = mock<CompanyRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const updateCompanyService = new UpdateCompanyService(companyRepository, eventDispatcher);

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

    it('should update a company', async () => {
        const existingCompany = fakeCompany();

        const oldCompany = fakeCompany(existingCompany);

        const payload: UpdateCompanyDto = {
            id: existingCompany.id,
            name: 'New name',
        };

        jest.spyOn(companyRepository, 'findById').mockResolvedValueOnce(existingCompany);

        const updatedCompany = fakeCompany({
            ...existingCompany,
            ...payload,
            updatedAt: now,
        });

        await expect(updateCompanyService.execute({actor, payload})).resolves.toEqual(new CompanyDto(updatedCompany));

        expect(existingCompany.events).toHaveLength(1);
        expect(existingCompany.events[0]).toBeInstanceOf(CompanyChangedEvent);
        expect(existingCompany.events).toEqual([
            {
                type: CompanyChangedEvent.type,
                companyId: existingCompany.id,
                timestamp: now,
                oldState: oldCompany,
                newState: existingCompany,
            },
        ]);

        expect(companyRepository.save).toHaveBeenCalledWith(existingCompany);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingCompany);
    });

    it('should throw an error when the company does not exist', async () => {
        const payload: UpdateCompanyDto = {
            id: CompanyId.generate(),
            name: 'New name',
        };

        jest.spyOn(companyRepository, 'findById').mockResolvedValueOnce(null);

        await expect(updateCompanyService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Company not found'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
