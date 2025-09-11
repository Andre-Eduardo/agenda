import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {DuplicateNameException, PreconditionException} from '../../../../domain/@shared/exceptions';
import {CompanyId} from '../../../../domain/company/entities';
import type {EventDispatcher} from '../../../../domain/event';
import {RoomId} from '../../../../domain/room/entities';
import {Stock, StockType} from '../../../../domain/stock/entities';
import {fakeStock} from '../../../../domain/stock/entities/__tests__/fake-stock';
import {StockCreatedEvent} from '../../../../domain/stock/events';
import {DuplicateMainStockException, DuplicateRoomException} from '../../../../domain/stock/stock.exceptions';
import type {StockRepository} from '../../../../domain/stock/stock.repository';
import {UserId} from '../../../../domain/user/entities';
import type {CreateStockDto} from '../../dtos';
import {StockDto} from '../../dtos';
import {CreateStockService} from '../create-stock.service';

describe('A create-stock service', () => {
    const stockRepository = mock<StockRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const createStockService = new CreateStockService(stockRepository, eventDispatcher);

    const roomId = RoomId.generate();
    const companyId = CompanyId.generate();

    const now = new Date();

    const mainStock = fakeStock({type: StockType.MAIN, companyId});

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it.each<CreateStockDto>([
        {
            companyId,
            type: StockType.MAIN,
            parentId: mainStock.id,
        },
        {
            companyId,
            type: StockType.ROOM,
            roomId,
            parentId: mainStock.id,
        },
        {
            companyId,
            type: StockType.HALLWAY,
            name: 'Amenities',
            parentId: mainStock.id,
        },
        {
            companyId,
            type: StockType.OTHER,
            name: 'Food stock',
            parentId: mainStock.id,
        },
    ])('should create a stock', async (payload) => {
        const stock = Stock.create(payload);

        jest.spyOn(Stock, 'create').mockReturnValue(stock);
        jest.spyOn(stockRepository, 'search').mockResolvedValueOnce({
            data: [],
            totalCount: 0,
            nextCursor: null,
        });

        await expect(createStockService.execute({actor, payload})).resolves.toEqual(new StockDto(stock));

        expect(Stock.create).toHaveBeenCalledWith(payload);

        expect(stock.events).toHaveLength(1);
        expect(stock.events[0]).toBeInstanceOf(StockCreatedEvent);
        expect(stock.events).toEqual([
            {
                type: StockCreatedEvent.type,
                stock,
                companyId,
                timestamp: now,
            },
        ]);

        expect(stockRepository.save).toHaveBeenCalledWith(stock);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, stock);
    });

    it('should throw an error if the main stock already exists', async () => {
        const payload: CreateStockDto = {
            companyId,
            type: StockType.MAIN,
            parentId: mainStock.id,
        };

        jest.spyOn(stockRepository, 'search').mockResolvedValueOnce({
            data: [mainStock],
            totalCount: 1,
            nextCursor: null,
        });

        await expect(createStockService.execute({actor, payload})).rejects.toThrowWithMessage(
            DuplicateMainStockException,
            'Main stock already exists.'
        );
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error if the stock name is already in use', async () => {
        const payload: CreateStockDto = {
            companyId,
            name: 'Main stock',
            type: StockType.OTHER,
            parentId: mainStock.id,
        };

        const stock = fakeStock({...payload});

        jest.spyOn(Stock, 'create').mockReturnValue(stock);
        jest.spyOn(stockRepository, 'save').mockRejectedValueOnce(new DuplicateNameException());

        await expect(createStockService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot create a stock with a name already in use.'
        );
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error if the stock room is already in use', async () => {
        const payload: CreateStockDto = {
            companyId,
            roomId,
            type: StockType.ROOM,
            parentId: mainStock.id,
        };

        const stock = fakeStock({companyId, roomId, type: StockType.ROOM, parentId: mainStock.id, name: null});

        jest.spyOn(Stock, 'create').mockReturnValue(stock);
        jest.spyOn(stockRepository, 'save').mockRejectedValueOnce(new DuplicateRoomException());

        await expect(createStockService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot create a stock for a room that already has a stock.'
        );
    });

    it('should throw an error when failing to save the stock', async () => {
        const payload: CreateStockDto = {
            companyId,
            name: 'Main stock',
            type: StockType.OTHER,
            parentId: mainStock.id,
        };

        const stock = fakeStock({...payload});

        jest.spyOn(Stock, 'create').mockReturnValue(stock);
        jest.spyOn(stockRepository, 'save').mockRejectedValueOnce(new Error('Failed to save stock'));

        await expect(createStockService.execute({actor, payload})).rejects.toThrowWithMessage(
            Error,
            'Failed to save stock'
        );
    });
});
