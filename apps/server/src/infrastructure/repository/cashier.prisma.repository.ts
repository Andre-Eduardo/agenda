import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {CashierRepository, CashierSearchFilter, type CashierSortOptions} from '../../domain/cashier/cashier.repository';
import {Cashier, CashierId} from '../../domain/cashier/entities';
import {CompanyId} from '../../domain/company/entities';
import {UserId} from '../../domain/user/entities';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';

export type CashierModel = PrismaClient.Cashier;

@Injectable()
export class CashierPrismaRepository extends PrismaRepository implements CashierRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    private static normalize(cashier: CashierModel): Cashier {
        return new Cashier({
            ...cashier,
            id: CashierId.from(cashier.id),
            companyId: CompanyId.from(cashier.companyId),
            userId: UserId.from(cashier.userId),
        });
    }

    private static denormalize(cashier: Cashier): CashierModel {
        return {
            id: cashier.id.toString(),
            companyId: cashier.companyId.toString(),
            userId: cashier.userId.toString(),
            createdAt: cashier.createdAt,
            updatedAt: cashier.updatedAt,
            closedAt: cashier.closedAt,
        };
    }

    async findById(id: CashierId): Promise<Cashier | null> {
        const cashier = await this.prisma.cashier.findUnique({
            where: {
                id: id.toString(),
            },
        });

        return cashier === null ? null : CashierPrismaRepository.normalize(cashier);
    }

    async findOpened(companyId: CompanyId, userId: UserId): Promise<Cashier | null> {
        const openedCashier = await this.prisma.cashier.findFirst({
            where: {
                companyId: companyId.toString(),
                userId: userId.toString(),
                closedAt: null,
            },
        });

        return openedCashier === null ? null : CashierPrismaRepository.normalize(openedCashier);
    }

    async search(
        companyId: CompanyId,
        pagination: Pagination<CashierSortOptions>,
        filter: CashierSearchFilter = {}
    ): Promise<PaginatedList<Cashier>> {
        const where: PrismaClient.Prisma.CashierWhereInput = {
            companyId: companyId.toString(),
            userId: filter.userId?.toString(),
            createdAt:
                filter.createdAt === undefined ? undefined : {gte: filter.createdAt.from, lte: filter.createdAt.to},
            closedAt: filter.closedAt == null ? filter.closedAt : {gte: filter.closedAt.from, lte: filter.closedAt.to},
        };

        const [cashiers, totalCount] = await Promise.all([
            this.prisma.cashier.findMany({
                where,
                ...(pagination.cursor && {
                    cursor: {
                        id: pagination.cursor,
                    },
                }),
                take: pagination.limit + 1,
                orderBy: this.normalizeSort(pagination.sort, {id: 'asc'}),
            }),
            this.prisma.cashier.count({where}),
        ]);

        return {
            data: cashiers.slice(0, pagination.limit).map((cashier) => CashierPrismaRepository.normalize(cashier)),
            totalCount,
            nextCursor: cashiers.length > pagination.limit ? cashiers[cashiers.length - 1].id : null,
        };
    }

    async save(cashier: Cashier): Promise<void> {
        const cashierModel = CashierPrismaRepository.denormalize(cashier);

        await this.prisma.cashier.upsert({
            where: {
                id: cashierModel.id,
            },
            create: cashierModel,
            update: cashierModel,
        });
    }
}
