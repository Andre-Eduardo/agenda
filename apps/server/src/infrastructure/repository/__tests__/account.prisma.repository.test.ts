import {mockDeep} from 'jest-mock-extended';
import type {Pagination} from '../../../domain/@shared/repository';
import type {AccountSearchFilter, AccountSortOptions} from '../../../domain/account/account.repository';
import type {Account} from '../../../domain/account/entities';
import {AccountType} from '../../../domain/account/entities';
import {fakeAccount} from '../../../domain/account/entities/__tests__/fake-account';
import {CompanyId} from '../../../domain/company/entities';
import type {AccountModel} from '../account.prisma.repository';
import {AccountPrismaRepository} from '../account.prisma.repository';
import type {PrismaService} from '../prisma';

describe('An account repository backed by Prisma ORM', () => {
    const prisma = mockDeep<PrismaService>();
    const repository = new AccountPrismaRepository(prisma);

    const companyId = CompanyId.generate();

    const domainAccounts: Account[] = [
        fakeAccount({companyId, type: AccountType.BANK}),
        fakeAccount({
            companyId,
            name: 'Account 2',
            type: AccountType.INTERNAL,
            bankId: null,
            accountNumber: null,
            accountDigit: null,
            agencyNumber: null,
            agencyDigit: null,
        }),
    ];

    const databaseAccounts: AccountModel[] = [
        {
            id: domainAccounts[0].id.toString(),
            companyId: domainAccounts[0].companyId.toString(),
            name: domainAccounts[0].name,
            type: domainAccounts[0].type,
            bankId: domainAccounts[0].bankId ?? null,
            accountNumber: domainAccounts[0].accountNumber ?? null,
            accountDigit: domainAccounts[0].accountDigit ?? null,
            agencyNumber: domainAccounts[0].agencyNumber ?? null,
            agencyDigit: domainAccounts[0].agencyDigit ?? null,
            createdAt: domainAccounts[0].createdAt,
            updatedAt: domainAccounts[0].updatedAt,
        },
        {
            id: domainAccounts[1].id.toString(),
            companyId: domainAccounts[1].companyId.toString(),
            name: domainAccounts[1].name,
            type: domainAccounts[1].type,
            bankId: domainAccounts[1].bankId ?? null,
            accountNumber: domainAccounts[1].accountNumber ?? null,
            accountDigit: domainAccounts[1].accountDigit ?? null,
            agencyNumber: domainAccounts[1].agencyNumber ?? null,
            agencyDigit: domainAccounts[1].agencyDigit ?? null,
            createdAt: domainAccounts[1].createdAt,
            updatedAt: domainAccounts[1].updatedAt,
        },
    ];

    it.each([
        [null, null],
        [databaseAccounts[0], domainAccounts[0]],
    ])('should find an account by ID', async (databaseAccount, domainAccount) => {
        jest.spyOn(prisma.account, 'findUnique').mockResolvedValueOnce(databaseAccount);

        await expect(repository.findById(domainAccounts[0].id)).resolves.toEqual(domainAccount);

        expect(prisma.account.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.account.findUnique).toHaveBeenCalledWith({
            where: {
                id: domainAccounts[0].id.toString(),
            },
        });
    });

    it('should search accounts', async () => {
        const pagination: Pagination<AccountSortOptions> = {
            limit: 10,
            sort: {
                createdAt: 'desc',
            },
        };

        const filter: AccountSearchFilter = {
            name: 'Account',
        };

        jest.spyOn(prisma.account, 'findMany').mockResolvedValueOnce(databaseAccounts);
        jest.spyOn(prisma.account, 'count').mockResolvedValueOnce(databaseAccounts.length);

        await expect(repository.search(companyId, pagination, filter)).resolves.toEqual({
            data: domainAccounts,
            totalCount: databaseAccounts.length,
            nextCursor: null,
        });

        expect(prisma.account.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.account.findMany).toHaveBeenCalledWith({
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

    it('should paginate accounts', async () => {
        const pagination: Pagination<AccountSortOptions> = {
            limit: 1,
            cursor: 'some-cursor',
            sort: {},
        };

        const filter: AccountSearchFilter = {
            name: 'Account',
        };

        jest.spyOn(prisma.account, 'findMany').mockResolvedValueOnce(databaseAccounts.slice(0, pagination.limit + 1));
        jest.spyOn(prisma.account, 'count').mockResolvedValueOnce(databaseAccounts.length);

        const result = await repository.search(companyId, pagination, filter);

        expect(result).toEqual({
            data: [domainAccounts[0]],
            totalCount: databaseAccounts.length,
            nextCursor: databaseAccounts[1].id,
        });

        expect(prisma.account.findMany).toHaveBeenCalledWith({
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

    it('should save an account', async () => {
        jest.spyOn(prisma.account, 'upsert');

        await repository.save(domainAccounts[1]);

        expect(prisma.account.upsert).toHaveBeenCalledTimes(1);
        expect(prisma.account.upsert).toHaveBeenCalledWith({
            where: {
                id: domainAccounts[1].id.toString(),
            },
            update: databaseAccounts[1],
            create: databaseAccounts[1],
        });
    });

    it('should delete an account by ID', async () => {
        jest.spyOn(prisma.account, 'delete');

        await repository.delete(domainAccounts[0].id);

        expect(prisma.account.delete).toHaveBeenCalledTimes(1);
        expect(prisma.account.delete).toHaveBeenCalledWith({
            where: {
                id: domainAccounts[0].id.toString(),
            },
        });
    });
});
