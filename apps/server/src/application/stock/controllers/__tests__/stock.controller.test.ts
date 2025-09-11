import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {CompanyId} from '../../../../domain/company/entities';
import {RoomId} from '../../../../domain/room/entities';
import {StockType, StockId} from '../../../../domain/stock/entities';
import {fakeStock} from '../../../../domain/stock/entities/__tests__/fake-stock';
import {UserId} from '../../../../domain/user/entities';
import type {PaginatedDto} from '../../../@shared/dto';
import {type CreateStockDto, StockDto} from '../../dtos';
import type {
    CreateStockService,
    DeleteStockService,
    GetStockService,
    ListStockService,
    UpdateStockService,
} from '../../services';
import {StockController} from '../index';

describe('A stock controller', () => {
    const createStockServiceMock = mock<CreateStockService>();
    const getStockServiceMock = mock<GetStockService>();
    const listStockServiceMock = mock<ListStockService>();
    const updateStockServiceMock = mock<UpdateStockService>();
    const deleteStockServiceMock = mock<DeleteStockService>();
    const stockController = new StockController(
        createStockServiceMock,
        getStockServiceMock,
        listStockServiceMock,
        updateStockServiceMock,
        deleteStockServiceMock
    );

    const companyId = CompanyId.generate();
    const mainStock = fakeStock({type: StockType.MAIN, companyId});

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    describe('when creating a stock', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload: CreateStockDto = {
                companyId,
                name: 'Stock hallway',
                type: StockType.HALLWAY,
                parentId: mainStock.id,
            };

            const expectedStock = new StockDto(fakeStock(payload));

            jest.spyOn(createStockServiceMock, 'execute').mockResolvedValueOnce(expectedStock);

            await expect(stockController.createStock(actor, payload)).resolves.toEqual(expectedStock);

            expect(createStockServiceMock.execute).toHaveBeenCalledWith({actor, payload});
            expect(getStockServiceMock.execute).not.toHaveBeenCalled();
            expect(listStockServiceMock.execute).not.toHaveBeenCalled();
            expect(deleteStockServiceMock.execute).not.toHaveBeenCalled();
        });
    });

    describe('when getting a stock', () => {
        it('should repass the responsibility to the right service', async () => {
            const stock = fakeStock({companyId, parentId: mainStock.id});

            const expectedStock = new StockDto(stock);

            jest.spyOn(getStockServiceMock, 'execute').mockResolvedValue(expectedStock);

            await expect(stockController.getStock(actor, stock.id)).resolves.toEqual(expectedStock);

            expect(getStockServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id: stock.id}});
        });
    });

    describe('when listing stocks', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload = {
                companyId,
                pagination: {
                    limit: 2,
                },
            };

            const stocks = [
                fakeStock({
                    companyId,
                    name: 'Stock Dry',
                    type: StockType.MAIN,
                }),
                fakeStock({
                    companyId,
                    type: StockType.ROOM,
                    roomId: RoomId.generate(),
                    name: null,
                    parentId: mainStock.id,
                }),
            ];

            const expectedStock: PaginatedDto<StockDto> = {
                data: stocks.map((stock) => new StockDto(stock)),
                totalCount: 2,
                nextCursor: 'nextCursor',
            };

            jest.spyOn(listStockServiceMock, 'execute').mockResolvedValue(expectedStock);

            await expect(stockController.listStocks(actor, payload)).resolves.toEqual(expectedStock);

            expect(listStockServiceMock.execute).toHaveBeenCalledWith({actor, payload});
        });
    });

    describe('when updating a stock', () => {
        it('should repass the responsibility to the right service', async () => {
            const stock = fakeStock({
                companyId,
                type: StockType.HALLWAY,
                name: 'Red hallway',
                parentId: mainStock.id,
            });

            const payload = {
                name: 'Green hallway',
            };

            const existingStock = new StockDto(stock);

            jest.spyOn(updateStockServiceMock, 'execute').mockResolvedValueOnce(existingStock);

            await expect(stockController.updateStock(actor, stock.id, payload)).resolves.toEqual(existingStock);

            expect(updateStockServiceMock.execute).toHaveBeenCalledWith({
                actor,
                payload: {id: stock.id, ...payload},
            });
        });
    });

    describe('when deleting a stock', () => {
        it('should repass the responsibility to the right service', async () => {
            const id = StockId.generate();

            await stockController.deleteStock(actor, id);

            expect(deleteStockServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id}});
        });
    });
});
