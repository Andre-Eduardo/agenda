import {Injectable} from '@nestjs/common';
import PrismaClient from '@prisma/client';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {AccountRepository, AccountSearchFilter, AccountSortOptions} from '../../domain/account/account.repository';
import {Account, AccountId, AccountType} from '../../domain/account/entities';
import {CompanyId} from '../../domain/company/entities';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';

export type AccountModel = PrismaClient.Account;

@Injectable()
export class AccountPrismaRepository extends PrismaRepository implements AccountRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    private static normalize(account: AccountModel): Account {
        return new Account({
            ...account,
            id: AccountId.from(account.id),
            companyId: CompanyId.from(account.companyId),
            type: AccountType[account.type],
        });
    }

    private static denormalize(account: Account): AccountModel {
        return {
            id: account.id.toString(),
            companyId: account.companyId.toString(),
            name: account.name,
            type: account.type,
            bankId: account.bankId ?? null,
            agencyNumber: account.agencyNumber ?? null,
            agencyDigit: account.agencyDigit ?? null,
            accountDigit: account.accountDigit ?? null,
            accountNumber: account.accountNumber ?? null,
            createdAt: account.createdAt,
            updatedAt: account.updatedAt,
        };
    }

    async findById(id: AccountId): Promise<Account | null> {
        const account = await this.prisma.account.findUnique({
            where: {
                id: id.toString(),
            },
        });

        return account === null ? null : AccountPrismaRepository.normalize(account);
    }

    async search(
        companyId: CompanyId,
        pagination: Pagination<AccountSortOptions>,
        filter?: AccountSearchFilter
    ): Promise<PaginatedList<Account>> {
        const where: PrismaClient.Prisma.AccountWhereInput = {
            companyId: companyId.toString(),
            name: {
                mode: 'insensitive',
                contains: filter?.name,
            },
            type: filter?.type,
        };

        const [accounts, totalCount] = await Promise.all([
            this.prisma.account.findMany({
                where,
                ...(pagination.cursor && {
                    cursor: {
                        id: pagination.cursor,
                    },
                }),
                take: pagination.limit + 1,
                orderBy: this.normalizeSort(pagination.sort, {id: 'asc'}),
            }),
            this.prisma.account.count({where}),
        ]);

        return {
            data: accounts.slice(0, pagination.limit).map((account) => AccountPrismaRepository.normalize(account)),
            totalCount,
            nextCursor: accounts.length > pagination.limit ? accounts[accounts.length - 1].id : null,
        };
    }

    async save(account: Account): Promise<void> {
        const accountModel = AccountPrismaRepository.denormalize(account);

        await this.prisma.account.upsert({
            where: {
                id: accountModel.id,
            },
            update: accountModel,
            create: accountModel,
        });
    }

    async delete(id: AccountId): Promise<void> {
        await this.prisma.account.delete({
            where: {
                id: id.toString(),
            },
        });
    }
}
