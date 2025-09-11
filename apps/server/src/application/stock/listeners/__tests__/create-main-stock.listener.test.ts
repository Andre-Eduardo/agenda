import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {Company, CompanyId} from '../../../../domain/company/entities';
import {CompanyCreatedEvent} from '../../../../domain/company/events';
import {StockType} from '../../../../domain/stock/entities';
import {UserId} from '../../../../domain/user/entities';
import type {CreateStockService} from '../../services';
import {CreateMainStockListener} from '../create-main-stock.listener';

describe('CreateMainStockListener', () => {
    const companyId = CompanyId.generate();
    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should create a main stock when a company is created', async () => {
        const createStockService = mock<CreateStockService>();
        const listener = new CreateMainStockListener(createStockService);
        const name = 'Ecxus';

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

        await listener.handle({
            actor,
            payload: {
                companyId,
                company,
                type: CompanyCreatedEvent.type,
                timestamp: now,
            },
        });

        expect(createStockService.execute).toHaveBeenCalledWith({
            actor,
            payload: {
                companyId,
                type: StockType.MAIN,
            },
        });
    });
});
