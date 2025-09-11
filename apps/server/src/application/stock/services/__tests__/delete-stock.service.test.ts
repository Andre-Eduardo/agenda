import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {PreconditionException, ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import {CompanyId} from '../../../../domain/company/entities';
import type {EventDispatcher} from '../../../../domain/event';
import {StockId, StockType} from '../../../../domain/stock/entities';
import {fakeStock} from '../../../../domain/stock/entities/__tests__/fake-stock';
import {StockDeletedEvent} from '../../../../domain/stock/events';
import {StockWithChildrenException} from '../../../../domain/stock/stock.exceptions';
import type {StockRepository} from '../../../../domain/stock/stock.repository';
import {UserId} from '../../../../domain/user/entities';
import type {DeleteStockDto} from '../../dtos';
import {DeleteStockService} from '../delete-stock.service';

describe('A delete-stock service', () => {
    const stockRepository = mock<StockRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const deleteStockService = new DeleteStockService(stockRepository, eventDispatcher);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const now = new Date();

    const mainStock = fakeStock();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should delete a stock', async () => {
        const existingStock = fakeStock({
            id: StockId.generate(),
            companyId: CompanyId.generate(),
            name: 'Other stock',
            type: StockType.OTHER,
            roomId: null,
            parentId: mainStock.id,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const payload: DeleteStockDto = {
            id: existingStock.id,
        };

        jest.spyOn(stockRepository, 'findById').mockResolvedValueOnce(existingStock);

        await deleteStockService.execute({actor, payload});

        expect(existingStock.events).toHaveLength(1);
        expect(existingStock.events[0]).toBeInstanceOf(StockDeletedEvent);
        expect(existingStock.events).toEqual([
            {
                type: StockDeletedEvent.type,
                stock: existingStock,
                companyId: existingStock.companyId,
                timestamp: now,
            },
        ]);
        expect(stockRepository.delete).toHaveBeenCalledWith(existingStock.id);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingStock);
    });

    it('should throw an error when the stock does not exist', async () => {
        const payload: DeleteStockDto = {
            id: StockId.generate(),
        };

        jest.spyOn(stockRepository, 'findById').mockResolvedValueOnce(null);

        await expect(deleteStockService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Stock not found'
        );
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should fail to delete the main stock', async () => {
        const payload: DeleteStockDto = {
            id: mainStock.id,
        };

        jest.spyOn(stockRepository, 'findById').mockResolvedValueOnce(mainStock);

        await expect(deleteStockService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot delete the main stock.'
        );
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should fail to delete a stock with children', async () => {
        const stockParent = fakeStock({
            id: StockId.generate(),
            companyId: CompanyId.generate(),
            name: 'Other stock',
            type: StockType.OTHER,
            roomId: null,
            parentId: mainStock.id,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const payload: DeleteStockDto = {
            id: stockParent.id,
        };

        jest.spyOn(stockRepository, 'findById').mockResolvedValueOnce(stockParent);
        jest.spyOn(stockRepository, 'delete').mockRejectedValueOnce(new StockWithChildrenException());

        await expect(deleteStockService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot delete a stock with children.'
        );
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error when failing to delete the stock', async () => {
        const existingStock = fakeStock({
            id: StockId.generate(),
            companyId: CompanyId.generate(),
            name: 'Other stock',
            type: StockType.OTHER,
            roomId: null,
            parentId: mainStock.id,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const payload: DeleteStockDto = {
            id: existingStock.id,
        };

        jest.spyOn(stockRepository, 'findById').mockResolvedValueOnce(existingStock);
        jest.spyOn(stockRepository, 'delete').mockRejectedValueOnce(new Error('Failed to delete stock'));

        await expect(deleteStockService.execute({actor, payload})).rejects.toThrowWithMessage(
            Error,
            'Failed to delete stock'
        );
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
