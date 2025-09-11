import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import {CompanyId} from '../../../../domain/company/entities';
import {RoomId} from '../../../../domain/room/entities';
import {Stock, StockId, StockType} from '../../../../domain/stock/entities';
import {fakeStock} from '../../../../domain/stock/entities/__tests__/fake-stock';
import type {StockRepository} from '../../../../domain/stock/stock.repository';
import {UserId} from '../../../../domain/user/entities';
import type {ListStockDto} from '../../dtos';
import {StockDto} from '../../dtos';
import {ListStockService} from '../list-stock.service';

describe('A list-stock service', () => {
    const stockRepository = mock<StockRepository>();
    const listStockService = new ListStockService(stockRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const mainStock = fakeStock({
        id: StockId.generate(),
        companyId: CompanyId.generate(),
        name: 'Stock hallway',
        type: StockType.MAIN,
        roomId: null,
        parentId: null,
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
    });

    it('should list stocks', async () => {
        const companyId = CompanyId.generate();
        const existingStock = [
            new Stock({
                id: StockId.generate(),
                companyId,
                name: null,
                type: StockType.ROOM,
                roomId: RoomId.generate(),
                parentId: mainStock.id,
                createdAt: new Date(1000),
                updatedAt: new Date(1000),
            }),
            new Stock({
                id: StockId.generate(),
                companyId,
                type: StockType.HALLWAY,
                name: 'Stock hallway',
                roomId: null,
                parentId: mainStock.id,
                createdAt: new Date(1000),
                updatedAt: new Date(1000),
            }),
        ];

        const paginatedStocks: PaginatedList<Stock> = {
            data: existingStock,
            totalCount: existingStock.length,
            nextCursor: null,
        };

        const payload: ListStockDto = {
            companyId,
            name: 'Stock hallway',
            pagination: {
                limit: 2,
            },
        };

        jest.spyOn(stockRepository, 'search').mockResolvedValueOnce(paginatedStocks);

        await expect(listStockService.execute({actor, payload})).resolves.toEqual({
            data: existingStock.map((stock) => new StockDto(stock)),
            totalCount: existingStock.length,
            nextCursor: null,
        });
        expect(existingStock.flatMap((stock) => stock.events)).toHaveLength(0);

        expect(stockRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                limit: 2,
                sort: {},
                cursor: undefined,
            },
            {
                name: 'Stock hallway',
                roomId: undefined,
                type: undefined,
            }
        );
    });

    it('should paginate stocks', async () => {
        const companyId = CompanyId.generate();
        const existingStock = [
            fakeStock({
                id: StockId.generate(),
                companyId,
                type: StockType.OTHER,
                name: 'Stock other',
                roomId: null,
                parentId: mainStock.id,
                createdAt: new Date(1000),
                updatedAt: new Date(1000),
            }),
            fakeStock({
                id: StockId.generate(),
                companyId,
                type: StockType.HALLWAY,
                name: 'Stock hallway',
                roomId: null,
                parentId: mainStock.id,
                createdAt: new Date(1000),
                updatedAt: new Date(1000),
            }),
        ];
        const paginatedStocks: PaginatedList<Stock> = {
            data: existingStock,
            totalCount: existingStock.length,
            nextCursor: null,
        };
        const payload: ListStockDto = {
            companyId,
            pagination: {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
            },
        };

        jest.spyOn(stockRepository, 'search').mockResolvedValueOnce(paginatedStocks);

        await expect(listStockService.execute({actor, payload})).resolves.toEqual({
            data: existingStock.map((stock) => new StockDto(stock)),
            totalCount: existingStock.length,
            nextCursor: null,
        });

        expect(existingStock.flatMap((stock) => stock.events)).toHaveLength(0);

        expect(stockRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
                sort: {},
            },
            {
                name: undefined,
            }
        );
    });
});
