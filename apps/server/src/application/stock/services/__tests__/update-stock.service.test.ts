import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {
    DuplicateNameException,
    PreconditionException,
    ResourceNotFoundException,
} from '../../../../domain/@shared/exceptions';
import {CompanyId} from '../../../../domain/company/entities';
import type {EventDispatcher} from '../../../../domain/event';
import {StockId, StockType} from '../../../../domain/stock/entities';
import {fakeStock} from '../../../../domain/stock/entities/__tests__/fake-stock';
import {StockChangedEvent} from '../../../../domain/stock/events';
import type {StockRepository} from '../../../../domain/stock/stock.repository';
import {UserId} from '../../../../domain/user/entities';
import type {UpdateStockDto} from '../../dtos';
import {StockDto} from '../../dtos';
import {UpdateStockService} from '../update-stock.service';

describe('A update-stock service', () => {
    const stockRepository = mock<StockRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const updateStockService = new UpdateStockService(stockRepository, eventDispatcher);

    const companyId = CompanyId.generate();
    const now = new Date();

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const mainStock = fakeStock({type: StockType.MAIN, companyId});

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should update a stock', async () => {
        const existingStock = fakeStock({
            id: StockId.generate(),
            companyId,
            name: 'Stock hallway',
            type: StockType.HALLWAY,
            roomId: null,
            parentId: mainStock.id,
            createdAt: new Date(1000),
            updatedAt: new Date(1000),
        });

        const oldStock = fakeStock(existingStock);

        const payload: UpdateStockDto = {
            id: existingStock.id,
            name: 'Stock hallway',
        };

        jest.spyOn(stockRepository, 'findById').mockResolvedValueOnce(existingStock);

        const updatedStock = fakeStock({
            ...existingStock,
            ...payload,
            updatedAt: now,
        });

        await expect(updateStockService.execute({actor, payload})).resolves.toEqual(new StockDto(updatedStock));

        expect(existingStock.name).toBe(payload.name);
        expect(existingStock.updatedAt).toEqual(now);
        expect(existingStock.events).toHaveLength(1);
        expect(existingStock.events[0]).toBeInstanceOf(StockChangedEvent);
        expect(existingStock.events).toEqual([
            {
                type: StockChangedEvent.type,
                companyId,
                timestamp: now,
                oldState: oldStock,
                newState: existingStock,
            },
        ]);
        expect(stockRepository.save).toHaveBeenCalledWith(existingStock);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingStock);
    });

    it('should throw an error when the stock does not exist', async () => {
        const payload: UpdateStockDto = {
            id: StockId.generate(),
        };

        jest.spyOn(stockRepository, 'findById').mockResolvedValueOnce(null);

        await expect(updateStockService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Stock not found'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error when the stock name is already in use', async () => {
        const payload: UpdateStockDto = {
            id: StockId.generate(),
            name: 'Main stock',
        };

        const existingStock = fakeStock({
            companyId,
            parentId: mainStock.id,
        });

        jest.spyOn(stockRepository, 'findById').mockResolvedValueOnce(existingStock);
        jest.spyOn(stockRepository, 'save').mockRejectedValueOnce(new DuplicateNameException('Duplicate name'));

        await expect(updateStockService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot update a stock with a name already in use.'
        );
    });

    it('should throw an error when failing to save the stock', async () => {
        const existingStock = fakeStock({
            companyId,
            parentId: mainStock.id,
        });

        const payload: UpdateStockDto = {
            id: existingStock.id,
            name: 'Main stock',
        };

        jest.spyOn(stockRepository, 'findById').mockResolvedValueOnce(existingStock);
        jest.spyOn(stockRepository, 'save').mockRejectedValueOnce(new Error('Error'));

        await expect(updateStockService.execute({actor, payload})).rejects.toThrow('Error');

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
