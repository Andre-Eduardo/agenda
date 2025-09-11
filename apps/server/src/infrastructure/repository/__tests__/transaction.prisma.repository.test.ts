import {mockDeep} from 'jest-mock-extended';
import type {Pagination} from '../../../domain/@shared/repository';
import {CompanyId} from '../../../domain/company/entities';
import type {Transaction} from '../../../domain/transaction/entities';
import {TransactionOriginType} from '../../../domain/transaction/entities';
import {fakeTransaction} from '../../../domain/transaction/entities/__tests__/fake-transaction';
import type {TransactionSearchFilter, TransactionSortOptions} from '../../../domain/transaction/transaction.repository';
import {type PrismaService} from '../prisma';
import type {TransactionModel} from '../transaction.prisma.repository';
import {TransactionPrismaRepository} from '../transaction.prisma.repository';

describe('A transaction repository backed by Prisma ORM', () => {
    const prisma = mockDeep<PrismaService>();
    const repository = new TransactionPrismaRepository(prisma);
    const companyId = CompanyId.generate();
    const domainTransactions: Transaction[] = [
        fakeTransaction({
            companyId,
            amount: 200,
            counterpartyId: null,
            originId: null,
            originType: null,
        }),
        fakeTransaction({
            companyId,
            amount: 100,
        }),
        fakeTransaction({
            companyId,
            amount: 10.5,
        }),
    ];

    const databaseTransactions: TransactionModel[] = domainTransactions.map((transaction) => ({
        id: transaction.id.toString(),
        companyId: transaction.companyId.toString(),
        amount: transaction.amount,
        paymentMethodId: transaction.paymentMethodId.toString(),
        counterpartyId: transaction.counterpartyId?.toString() ?? null,
        responsibleId: transaction.responsibleId.toString(),
        description: transaction.description,
        originId: transaction.originId?.toString() ?? null,
        originType: transaction.originType,
        type: transaction.type,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
    }));

    it.each([
        [null, null],
        [databaseTransactions[0], domainTransactions[0]],
    ])('should find a transaction by ID', async (databaseTransaction, domainTransaction) => {
        jest.spyOn(prisma.transaction, 'findUnique').mockResolvedValueOnce(databaseTransaction);

        const result = await repository.findById(domainTransactions[0].id);

        expect(result).toEqual(domainTransaction);
        expect(prisma.transaction.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.transaction.findUnique).toHaveBeenCalledWith({
            where: {
                id: domainTransactions[0].id.toString(),
            },
        });
    });

    it('should search transactions', async () => {
        const pagination: Pagination<TransactionSortOptions> = {
            limit: 5,
            sort: {
                createdAt: 'desc',
            },
        };

        const filter: TransactionSearchFilter = {
            ids: [domainTransactions[0].id, domainTransactions[1].id],
            amount: {
                from: domainTransactions[0].amount,
                to: domainTransactions[1].amount,
            },
            counterpartyId: domainTransactions[1].counterpartyId,
            originId: domainTransactions[1].originId,
            originType: TransactionOriginType.RESERVATION,
            type: domainTransactions[1].type,
            description: 'My description',
            responsibleId: domainTransactions[1].responsibleId,
        };

        jest.spyOn(prisma.transaction, 'findMany').mockResolvedValueOnce(databaseTransactions);
        jest.spyOn(prisma.transaction, 'count').mockResolvedValueOnce(databaseTransactions.length);

        await expect(repository.search(companyId, pagination, filter)).resolves.toEqual({
            data: domainTransactions,
            totalCount: databaseTransactions.length,
            nextCursor: null,
        });

        expect(prisma.transaction.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.transaction.findMany).toHaveBeenCalledWith({
            where: {
                id: {in: [domainTransactions[0].id.toString(), domainTransactions[1].id.toString()]},
                companyId: companyId.toString(),
                description: {contains: filter.description, mode: 'insensitive'},
                amount: {gte: domainTransactions[0].amount, lte: domainTransactions[1].amount},
                counterpartyId:
                    filter.counterpartyId == null ? filter.counterpartyId : filter.counterpartyId?.toString(),
                responsibleId: filter.responsibleId?.toString(),
                type: filter.type,
                originId: filter.originId?.toString(),
                originType: filter.originType,
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

        expect(prisma.transaction.count).toHaveBeenCalledTimes(1);
        expect(prisma.transaction.count).toHaveBeenCalledWith({
            where: {
                id: {in: [domainTransactions[0].id.toString(), domainTransactions[1].id.toString()]},
                companyId: companyId.toString(),
                description: {contains: filter.description, mode: 'insensitive'},
                amount: {gte: domainTransactions[0].amount, lte: domainTransactions[1].amount},
                counterpartyId:
                    filter.counterpartyId == null ? filter.counterpartyId : filter.counterpartyId?.toString(),
                responsibleId: filter.responsibleId?.toString(),
                type: filter.type,
                originId: filter.originId == null ? filter.originId : filter.originId?.toString(),
                originType: filter.originType,
            },
        });
    });

    it('should paginate transactions', async () => {
        const pagination: Pagination<TransactionSortOptions> = {
            limit: 1,
            sort: {},
        };

        jest.spyOn(prisma.transaction, 'findMany').mockResolvedValueOnce(
            databaseTransactions.slice(0, pagination.limit + 1)
        );
        jest.spyOn(prisma.transaction, 'count').mockResolvedValueOnce(databaseTransactions.length);

        const result = await repository.search(companyId, pagination);

        expect(result).toEqual({
            data: [domainTransactions[0]],
            totalCount: databaseTransactions.length,
            nextCursor: databaseTransactions[1].id,
        });

        expect(prisma.transaction.findMany).toHaveBeenCalledWith({
            where: {
                id: {in: undefined},
                companyId: companyId.toString(),
                description: {contains: undefined, mode: 'insensitive'},
            },
            take: 2,
            orderBy: [
                {
                    id: 'asc',
                },
            ],
        });

        jest.spyOn(prisma.transaction, 'findMany').mockResolvedValueOnce(
            databaseTransactions.slice(1, pagination.limit + 2)
        );
        jest.spyOn(prisma.transaction, 'count').mockResolvedValueOnce(databaseTransactions.length);

        await expect(
            repository.search(companyId, {
                ...pagination,
                cursor: result.nextCursor!,
            })
        ).resolves.toEqual({
            data: [domainTransactions[1]],
            totalCount: databaseTransactions.length,
            nextCursor: databaseTransactions[2].id,
        });

        expect(prisma.transaction.findMany).toHaveBeenCalledWith({
            where: {
                id: {in: undefined},
                companyId: companyId.toString(),
                description: {contains: undefined, mode: 'insensitive'},
            },
            take: 2,
            orderBy: [
                {
                    id: 'asc',
                },
            ],
        });
    });

    it.each([
        [databaseTransactions[0], domainTransactions[0]],
        [databaseTransactions[1], domainTransactions[1]],
    ])('should save a transaction', async (databaseTransaction, domainTransaction) => {
        jest.spyOn(prisma.transaction, 'upsert');

        await repository.save(domainTransaction);

        expect(prisma.transaction.upsert).toHaveBeenCalledTimes(1);
        expect(prisma.transaction.upsert).toHaveBeenCalledWith({
            where: {
                id: domainTransaction.id.toString(),
            },
            create: databaseTransaction,
            update: databaseTransaction,
        });
    });
});
