import {mockDeep} from 'jest-mock-extended';
import type {Pagination} from '../../../domain/@shared/repository';
import type {CashierSearchFilter, CashierSortOptions} from '../../../domain/cashier/cashier.repository';
import type {Cashier} from '../../../domain/cashier/entities';
import {fakeCashier} from '../../../domain/cashier/entities/__tests__/fake-cashier';
import {CompanyId} from '../../../domain/company/entities';
import type {CashierModel} from '../cashier.prisma.repository';
import {CashierPrismaRepository} from '../cashier.prisma.repository';
import {type PrismaService} from '../prisma';

describe('A cashier repository backed by Prisma ORM', () => {
    const prisma = mockDeep<PrismaService>();
    const repository = new CashierPrismaRepository(prisma);
    const companyId = CompanyId.generate();

    const domainCashiers: Cashier[] = [
        fakeCashier({companyId, createdAt: new Date(100), updatedAt: new Date(100), closedAt: new Date(150)}),
        fakeCashier({companyId, createdAt: new Date(200), updatedAt: new Date(200), closedAt: null}),
        fakeCashier({companyId, createdAt: new Date(300), updatedAt: new Date(300), closedAt: null}),
    ];

    const databaseCashiers: CashierModel[] = [
        {
            id: domainCashiers[0].id.toString(),
            companyId: domainCashiers[0].companyId.toString(),
            userId: domainCashiers[0].userId.toString(),
            createdAt: domainCashiers[0].createdAt,
            updatedAt: domainCashiers[0].updatedAt,
            closedAt: domainCashiers[0].closedAt,
        },
        {
            id: domainCashiers[1].id.toString(),
            companyId: domainCashiers[1].companyId.toString(),
            userId: domainCashiers[1].userId.toString(),
            createdAt: domainCashiers[1].createdAt,
            updatedAt: domainCashiers[1].updatedAt,
            closedAt: domainCashiers[1].closedAt,
        },
        {
            id: domainCashiers[2].id.toString(),
            companyId: domainCashiers[2].companyId.toString(),
            userId: domainCashiers[2].userId.toString(),
            createdAt: domainCashiers[2].createdAt,
            updatedAt: domainCashiers[2].updatedAt,
            closedAt: domainCashiers[2].closedAt,
        },
    ];

    it.each([
        [null, null],
        [databaseCashiers[0], domainCashiers[0]],
    ])('should find a cashier by ID', async (databaseCashier, domainCashier) => {
        jest.spyOn(prisma.cashier, 'findUnique').mockResolvedValueOnce(databaseCashier);

        const result = await repository.findById(domainCashiers[0].id);

        expect(result).toEqual(domainCashier);
        expect(prisma.cashier.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.cashier.findUnique).toHaveBeenCalledWith({
            where: {
                id: domainCashiers[0].id.toString(),
            },
        });
    });

    it('should save a cashier', async () => {
        jest.spyOn(prisma.cashier, 'findFirst').mockResolvedValueOnce(null);
        jest.spyOn(prisma.cashier, 'upsert');

        await repository.save(domainCashiers[2]);

        expect(prisma.cashier.upsert).toHaveBeenCalledTimes(1);
        expect(prisma.cashier.upsert).toHaveBeenCalledWith({
            where: {
                id: domainCashiers[2].id.toString(),
            },
            create: databaseCashiers[2],
            update: databaseCashiers[2],
        });
    });

    it('should rethrow an unknown error when saving a cashier', async () => {
        jest.spyOn(prisma.cashier, 'findFirst').mockResolvedValueOnce(null);
        jest.spyOn(prisma.cashier, 'upsert').mockRejectedValue(new Error('Generic error'));

        await expect(repository.save(domainCashiers[1])).rejects.toThrowWithMessage(Error, 'Generic error');
    });

    it.each<[Cashier, Cashier | null]>([
        [domainCashiers[0], null],
        [domainCashiers[1], domainCashiers[1]],
        [domainCashiers[2], domainCashiers[2]],
    ])('should find the cashier opened by the user', async (cashier, expected) => {
        const existingCashier = {
            ...cashier,
            id: cashier.id.toString(),
            companyId: cashier.companyId.toString(),
            userId: cashier.userId.toString(),
        };

        jest.spyOn(prisma.cashier, 'findFirst').mockResolvedValueOnce(
            existingCashier.closedAt === null ? existingCashier : null
        );

        await expect(repository.findOpened(cashier.companyId, cashier.userId)).resolves.toEqual(expected);

        expect(prisma.cashier.findFirst).toHaveBeenCalledTimes(1);
        expect(prisma.cashier.findFirst).toHaveBeenCalledWith({
            where: {
                companyId: existingCashier.companyId.toString(),
                userId: existingCashier.userId.toString(),
                closedAt: null,
            },
        });
    });

    it('should search opened cashiers', async () => {
        const pagination: Pagination<CashierSortOptions> = {
            limit: 5,
            sort: {
                createdAt: 'desc',
            },
        };

        const filter: CashierSearchFilter = {
            createdAt: {
                from: new Date(300),
                to: new Date(1000),
            },
            closedAt: null,
        };

        jest.spyOn(prisma.cashier, 'findMany').mockResolvedValueOnce(databaseCashiers);
        jest.spyOn(prisma.cashier, 'count').mockResolvedValueOnce(databaseCashiers.length);

        await expect(repository.search(companyId, pagination, filter)).resolves.toEqual({
            data: domainCashiers,
            totalCount: databaseCashiers.length,
            nextCursor: null,
        });

        expect(prisma.cashier.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.cashier.findMany).toHaveBeenCalledWith({
            where: {
                companyId: companyId.toString(),
                userId: undefined,
                createdAt: {gte: new Date(300), lte: new Date(1000)},
                closedAt: null,
            },
            take: 6,
            orderBy: [
                {
                    createdAt: 'desc',
                },
                {
                    id: 'asc',
                },
            ],
        });

        expect(prisma.cashier.count).toHaveBeenCalledTimes(1);
        expect(prisma.cashier.count).toHaveBeenCalledWith({
            where: {
                companyId: companyId.toString(),
                userId: undefined,
                createdAt: {gte: new Date(300), lte: new Date(1000)},
                closedAt: null,
            },
        });
    });

    it('should search closed cashiers', async () => {
        const pagination: Pagination<CashierSortOptions> = {
            limit: 5,
            sort: {
                createdAt: 'desc',
            },
        };

        const filter: CashierSearchFilter = {
            closedAt: {
                from: new Date(50),
                to: new Date(200),
            },
        };

        jest.spyOn(prisma.cashier, 'findMany').mockResolvedValueOnce(databaseCashiers);
        jest.spyOn(prisma.cashier, 'count').mockResolvedValueOnce(databaseCashiers.length);

        await expect(repository.search(companyId, pagination, filter)).resolves.toEqual({
            data: domainCashiers,
            totalCount: databaseCashiers.length,
            nextCursor: null,
        });

        expect(prisma.cashier.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.cashier.findMany).toHaveBeenCalledWith({
            where: {
                companyId: companyId.toString(),
                userId: undefined,
                closedAt: {gte: new Date(50), lte: new Date(200)},
            },
            take: 6,
            orderBy: [
                {
                    createdAt: 'desc',
                },
                {
                    id: 'asc',
                },
            ],
        });

        expect(prisma.cashier.count).toHaveBeenCalledTimes(1);
        expect(prisma.cashier.count).toHaveBeenCalledWith({
            where: {
                companyId: companyId.toString(),
                userId: undefined,
                closedAt: {gte: new Date(50), lte: new Date(200)},
            },
        });
    });

    it('should paginate cashier', async () => {
        const pagination: Pagination<CashierSortOptions> = {
            limit: 1,
            sort: {},
        };

        jest.spyOn(prisma.cashier, 'findMany').mockResolvedValueOnce(databaseCashiers.slice(0, pagination.limit + 1));
        jest.spyOn(prisma.cashier, 'count').mockResolvedValueOnce(databaseCashiers.length);

        const result = await repository.search(companyId, pagination);

        expect(result).toEqual({
            data: [domainCashiers[0]],
            totalCount: databaseCashiers.length,
            nextCursor: databaseCashiers[1].id,
        });

        expect(prisma.cashier.findMany).toHaveBeenCalledWith({
            where: {
                companyId: companyId.toString(),
                userId: undefined,
            },
            take: 2,
            orderBy: [
                {
                    id: 'asc',
                },
            ],
        });

        jest.spyOn(prisma.cashier, 'findMany').mockResolvedValueOnce(databaseCashiers.slice(1, pagination.limit + 2));
        jest.spyOn(prisma.cashier, 'count').mockResolvedValueOnce(databaseCashiers.length);

        await expect(
            repository.search(companyId, {
                ...pagination,
                cursor: result.nextCursor!,
            })
        ).resolves.toEqual({
            data: [domainCashiers[1]],
            totalCount: databaseCashiers.length,
            nextCursor: databaseCashiers[2].id,
        });

        expect(prisma.cashier.findMany).toHaveBeenCalledWith({
            where: {
                companyId: companyId.toString(),
                userId: undefined,
            },
            take: 2,
            orderBy: [
                {
                    id: 'asc',
                },
            ],
        });
    });
});
