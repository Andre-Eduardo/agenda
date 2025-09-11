import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import {CompanyId} from '../../../../domain/company/entities';
import {StockId, StockType} from '../../../../domain/stock/entities';
import {fakeStock} from '../../../../domain/stock/entities/__tests__/fake-stock';
import type {StockRepository} from '../../../../domain/stock/stock.repository';
import {UserId} from '../../../../domain/user/entities';
import type {GetStockDto} from '../../dtos';
import {StockDto} from '../../dtos';
import {GetStockService} from '../get-stock.service';

describe('A get-stock service', () => {
    const stockRepository = mock<StockRepository>();
    const getStockService = new GetStockService(stockRepository);
    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should get a stock', async () => {
        const existingStock = fakeStock({
            id: StockId.generate(),
            companyId: CompanyId.generate(),
            name: 'Stock hallway',
            type: StockType.MAIN,
            roomId: null,
            parentId: null,
            createdAt: new Date(1000),
            updatedAt: new Date(1000),
        });

        const payload: GetStockDto = {
            id: existingStock.id,
        };

        jest.spyOn(stockRepository, 'findById').mockResolvedValueOnce(existingStock);

        await expect(getStockService.execute({actor, payload})).resolves.toEqual(new StockDto(existingStock));

        expect(existingStock.events).toHaveLength(0);

        expect(stockRepository.findById).toHaveBeenCalledWith(payload.id);
    });

    it('should throw an error when the stock does not exist', async () => {
        const payload: GetStockDto = {
            id: StockId.generate(),
        };

        jest.spyOn(stockRepository, 'findById').mockResolvedValueOnce(null);

        await expect(getStockService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Stock not found'
        );
    });
});
