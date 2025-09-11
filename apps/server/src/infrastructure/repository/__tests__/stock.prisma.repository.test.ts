import {Prisma} from '@prisma/client';
import {mockDeep} from 'jest-mock-extended';
import {DuplicateNameException} from '../../../domain/@shared/exceptions';
import type {Pagination} from '../../../domain/@shared/repository';
import {CompanyId} from '../../../domain/company/entities';
import {RoomId} from '../../../domain/room/entities';
import type {Stock} from '../../../domain/stock/entities';
import {StockId, StockType} from '../../../domain/stock/entities';
import {fakeStock} from '../../../domain/stock/entities/__tests__/fake-stock';
import {DuplicateRoomException, StockWithChildrenException} from '../../../domain/stock/stock.exceptions';
import type {StockSearchFilter, StockSortOptions} from '../../../domain/stock/stock.repository';
import type {PrismaService} from '../prisma';
import {FOREIGN_KEY_CONSTRAINT_VIOLATION} from '../prisma';
import type {StockModel} from '../stock.prisma.repository';
import {StockPrismaRepository} from '../stock.prisma.repository';

describe('A stock repository backed by Prisma ORM', () => {
    const prisma = mockDeep<PrismaService>();
    const repository = new StockPrismaRepository(prisma);

    const companyId = CompanyId.generate();

    const mainStock = fakeStock({
        id: StockId.generate(),
        companyId,
        name: null,
        type: StockType.MAIN,
        roomId: null,
        parentId: null,
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
    });

    const domainStocks: Stock[] = [
        fakeStock({
            id: StockId.generate(),
            companyId: CompanyId.generate(),
            name: 'Main stock',
            type: StockType.OTHER,
            roomId: null,
            parentId: mainStock.id,
            createdAt: new Date(),
            updatedAt: new Date(),
        }),
        fakeStock({
            id: StockId.generate(),
            companyId: CompanyId.generate(),
            name: 'Stock hallway',
            type: StockType.HALLWAY,
            roomId: null,
            parentId: mainStock.id,
            createdAt: new Date(),
            updatedAt: new Date(),
        }),
        fakeStock({
            id: StockId.generate(),
            companyId: CompanyId.generate(),
            name: null,
            type: StockType.ROOM,
            roomId: RoomId.generate(),
            parentId: mainStock.id,
            createdAt: new Date(),
            updatedAt: new Date(),
        }),
        fakeStock({
            id: StockId.generate(),
            companyId: CompanyId.generate(),
            name: null,
            type: StockType.MAIN,
            roomId: null,
            parentId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        }),
    ];

    const databaseStocks: StockModel[] = [
        {
            id: domainStocks[0].id.toString(),
            companyId: domainStocks[0].companyId.toString(),
            name: domainStocks[0].name,
            type: StockType[domainStocks[0].type],
            roomId: null,
            parentId: mainStock.id.toString(),
            createdAt: domainStocks[0].createdAt,
            updatedAt: domainStocks[0].updatedAt,
        },
        {
            id: domainStocks[1].id.toString(),
            companyId: domainStocks[1].companyId.toString(),
            name: domainStocks[1].name,
            type: StockType[domainStocks[1].type],
            roomId: null,
            parentId: mainStock.id.toString(),
            createdAt: domainStocks[1].createdAt,
            updatedAt: domainStocks[1].updatedAt,
        },
        {
            id: domainStocks[2].id.toString(),
            companyId: domainStocks[2].companyId.toString(),
            name: null,
            type: StockType[domainStocks[2].type],
            roomId: domainStocks[2].roomId?.toString() ?? null,
            parentId: mainStock.id.toString(),
            createdAt: domainStocks[2].createdAt,
            updatedAt: domainStocks[2].updatedAt,
        },
        {
            id: domainStocks[3].id.toString(),
            companyId: domainStocks[3].companyId.toString(),
            name: null,
            type: StockType[domainStocks[3].type],
            roomId: null,
            parentId: null,
            createdAt: domainStocks[3].createdAt,
            updatedAt: domainStocks[3].updatedAt,
        },
    ];

    it.each([
        [null, null],
        [databaseStocks[0], domainStocks[0]],
    ])('should find a stock by ID', async (databaseStock, domainStock) => {
        jest.spyOn(prisma.stock, 'findUnique').mockResolvedValueOnce(databaseStock);

        await expect(repository.findById(domainStocks[0].id)).resolves.toEqual(domainStock);

        expect(prisma.stock.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.stock.findUnique).toHaveBeenCalledWith({
            where: {
                id: domainStocks[0].id.toString(),
            },
        });
    });

    it('should search stocks', async () => {
        const pagination: Pagination<StockSortOptions> = {
            limit: 10,
            sort: {
                createdAt: 'desc',
            },
        };

        const filter: StockSearchFilter = {
            name: 'Main stock',
        };

        jest.spyOn(prisma.stock, 'findMany').mockResolvedValueOnce(databaseStocks);
        jest.spyOn(prisma.stock, 'count').mockResolvedValueOnce(databaseStocks.length);

        await expect(repository.search(companyId, pagination, filter)).resolves.toEqual({
            data: domainStocks,
            totalCount: databaseStocks.length,
            nextCursor: null,
        });

        expect(prisma.stock.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.stock.findMany).toHaveBeenCalledWith({
            where: {
                companyId: companyId.toString(),
                name: {
                    mode: 'insensitive',
                    contains: filter.name,
                },
            },
            take: pagination.limit + 1,
            orderBy: [
                {
                    createdAt: 'desc',
                },
                {
                    id: 'asc',
                },
            ],
        });
    });

    it('should paginate stocks', async () => {
        const pagination: Pagination<StockSortOptions> = {
            limit: 1,
            cursor: 'some-cursor',
            sort: {},
        };

        const filter = {
            name: 'Stock',
        };

        jest.spyOn(prisma.stock, 'findMany').mockResolvedValueOnce(databaseStocks.slice(0, pagination.limit + 1));
        jest.spyOn(prisma.stock, 'count').mockResolvedValueOnce(databaseStocks.length);

        const result = await repository.search(companyId, pagination, filter);

        expect(result).toEqual({
            data: [domainStocks[0]],
            totalCount: databaseStocks.length,
            nextCursor: databaseStocks[1].id,
        });

        expect(prisma.stock.findMany).toHaveBeenCalledWith({
            where: {
                companyId: companyId.toString(),
                name: {
                    mode: 'insensitive',
                    contains: filter.name,
                },
            },
            cursor: {
                id: pagination.cursor,
            },
            take: 2,
            orderBy: [{id: 'asc'}],
        });
    });

    it('should save a stock', async () => {
        jest.spyOn(prisma.stock, 'upsert');

        await repository.save(domainStocks[0]);

        expect(prisma.stock.upsert).toHaveBeenCalledTimes(1);
        expect(prisma.stock.upsert).toHaveBeenCalledWith({
            where: {
                id: domainStocks[0].id.toString(),
            },
            update: databaseStocks[0],
            create: databaseStocks[0],
        });
    });

    it('should save a stock with a room', async () => {
        jest.spyOn(prisma.stock, 'upsert');

        await repository.save(domainStocks[2]);

        expect(prisma.stock.upsert).toHaveBeenCalledTimes(1);
        expect(prisma.stock.upsert).toHaveBeenCalledWith({
            where: {
                id: domainStocks[2].id.toString(),
            },
            update: databaseStocks[2],
            create: databaseStocks[2],
        });
    });

    it('should save a main stock', async () => {
        jest.spyOn(prisma.stock, 'upsert');

        await repository.save(domainStocks[3]);

        expect(prisma.stock.upsert).toHaveBeenCalledTimes(1);
        expect(prisma.stock.upsert).toHaveBeenCalledWith({
            where: {
                id: domainStocks[3].id.toString(),
            },
            update: databaseStocks[3],
            create: databaseStocks[3],
        });
    });

    it('should delete a stock by ID', async () => {
        jest.spyOn(prisma.stock, 'delete');

        await repository.delete(domainStocks[0].id);

        expect(prisma.stock.delete).toHaveBeenCalledTimes(1);
        expect(prisma.stock.delete).toHaveBeenCalledWith({
            where: {
                id: domainStocks[0].id.toString(),
            },
        });
    });

    it('should throw an exception when deleting a stock with children', async () => {
        jest.spyOn(prisma.stock, 'delete').mockRejectedValueOnce(
            new Prisma.PrismaClientKnownRequestError('Foreign key constraint violation', {
                clientVersion: '0.0.0',
                code: FOREIGN_KEY_CONSTRAINT_VIOLATION,
                meta: {
                    field_name: 'stock_parent_id_fkey (index)',
                },
            })
        );

        await expect(repository.delete(domainStocks[0].id)).rejects.toThrowWithMessage(
            StockWithChildrenException,
            'Stock has children.'
        );
    });

    it('should throw an unknown error when deleting a stock', async () => {
        const error = new Error('Unknown error');

        jest.spyOn(prisma.stock, 'delete').mockRejectedValueOnce(error);

        await expect(repository.delete(domainStocks[0].id)).rejects.toThrow(error);
    });

    it('should throw an exception when saving a stock with a duplicate name', async () => {
        jest.spyOn(prisma.stock, 'upsert').mockRejectedValueOnce(
            new Prisma.PrismaClientKnownRequestError('Unique constraint violation', {
                clientVersion: '0.0.0',
                code: 'P2002',
                meta: {
                    target: ['name'],
                },
            })
        );
        await expect(repository.save(domainStocks[0])).rejects.toThrowWithMessage(
            DuplicateNameException,
            'Duplicate stock name.'
        );
    });

    it('should throw an exception when saving a stock with a duplicate room', async () => {
        jest.spyOn(prisma.stock, 'upsert').mockRejectedValueOnce(
            new Prisma.PrismaClientKnownRequestError('Unique constraint violation', {
                clientVersion: '0.0.0',
                code: 'P2002',
                meta: {
                    target: ['roomId'],
                },
            })
        );
        await expect(repository.save(domainStocks[2])).rejects.toThrowWithMessage(
            DuplicateRoomException,
            'Duplicate stock room.'
        );
    });

    it('should throw an unknown error when saving a stock', async () => {
        const error = new Error('Unknown error');

        jest.spyOn(prisma.stock, 'upsert').mockRejectedValueOnce(error);

        await expect(repository.save(domainStocks[0])).rejects.toThrow(error);
    });
});
