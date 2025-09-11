import {CompanyChangedEvent, CompanyCreatedEvent, CompanyDeletedEvent} from '../../events';
import {Company, CompanyId} from '../index';
import {fakeCompany} from './fake-company';

describe('A company', () => {
    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('on creation', () => {
        it('should emit a company-created event', () => {
            const name = 'My Company';

            const company = Company.create({name});

            expect(company.name).toBe(name);

            expect(company.events).toEqual([
                {
                    type: CompanyCreatedEvent.type,
                    companyId: company.id,
                    company,
                    timestamp: now,
                },
            ]);
            expect(company.events[0]).toBeInstanceOf(CompanyCreatedEvent);
        });

        it('should throw an error when receiving invalid data', () => {
            expect(() => Company.create({name: ''})).toThrow('Company name must be at least 1 character long.');
        });
    });

    describe('on change', () => {
        it('should emit a company-changed event', () => {
            const company = fakeCompany();

            const oldCompany = fakeCompany(company);

            company.change({name: 'New name'});

            expect(company.name).toBe('New name');

            expect(company.events).toEqual([
                {
                    type: CompanyChangedEvent.type,
                    companyId: company.id,
                    timestamp: now,
                    oldState: oldCompany,
                    newState: company,
                },
            ]);
            expect(company.events[0]).toBeInstanceOf(CompanyChangedEvent);
        });

        it('should throw an error when receiving invalid data', () => {
            const company = fakeCompany();

            expect(() => company.change({name: ''})).toThrow('Company name must be at least 1 character long.');
        });
    });

    describe('on deletion', () => {
        it('should emit a company-deleted event', () => {
            const company = fakeCompany();

            company.delete();

            expect(company.events).toEqual([
                {
                    type: CompanyDeletedEvent.type,
                    companyId: company.id,
                    company,
                    timestamp: now,
                },
            ]);

            expect(company.events[0]).toBeInstanceOf(CompanyDeletedEvent);
        });
    });

    it('should be serializable', () => {
        const company = fakeCompany({
            name: 'My Company',
        });

        expect(company.toJSON()).toEqual({
            id: company.id.toJSON(),
            name: 'My Company',
            createdAt: company.createdAt.toJSON(),
            updatedAt: company.updatedAt.toJSON(),
        });
    });
});

describe('A company ID', () => {
    it('can be created from a string', () => {
        const uuid = '6267dbfa-177a-4596-882e-99572932ffce';
        const id = CompanyId.from(uuid);

        expect(id.toString()).toBe(uuid);
    });

    it('can be generated', () => {
        expect(CompanyId.generate()).toBeInstanceOf(CompanyId);
    });
});
