import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {Prisma} from '@prisma/client';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {CompanyId} from '../../domain/company/entities';
import {PersonId} from '../../domain/person/entities';
import {
    DirectSaleRepository,
    DirectSaleSearchFilter,
    DirectSaleSortOptions,
} from '../../domain/sale/direct-sale.repository';
import {DirectSale, SaleId} from '../../domain/sale/entities';
import {UserId} from '../../domain/user/entities';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';
import {SalePrismaRepository} from './sale.prisma.repository';

const directSaleSelect = Prisma.validator<Prisma.DirectSaleDefaultArgs>()({
    include: {
        sale: {
            include: {
                items: true,
            },
        },
    },
});

export type DirectSaleModel = Prisma.DirectSaleGetPayload<typeof directSaleSelect>;

@Injectable()
export class DirectSalePrismaRepository extends PrismaRepository implements DirectSaleRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    private static normalize(directSale: DirectSaleModel): DirectSale {
        return new DirectSale({
            ...directSale,
            ...directSale.sale,
            id: SaleId.from(directSale.sale.id),
            companyId: CompanyId.from(directSale.sale.companyId),
            sellerId: UserId.from(directSale.sale.sellerId),
            buyerId: directSale.buyerId === null ? null : PersonId.from(directSale.buyerId),
            items: directSale.sale.items.map((saleItem) => SalePrismaRepository.normalizeItem(saleItem)),
        });
    }

    private static denormalize(directSale: DirectSale): DirectSaleModel {
        return {
            id: directSale.id.toString(),
            buyerId: directSale.buyerId?.toString() ?? null,
            sale: {
                id: directSale.id.toString(),
                companyId: directSale.companyId.toString(),
                sellerId: directSale.sellerId.toString(),
                items: directSale.items.map((saleItem) => SalePrismaRepository.denormalizeItem(saleItem)),
                note: directSale.note,
                createdAt: directSale.createdAt,
                updatedAt: directSale.updatedAt,
            },
        };
    }

    async findById(id: SaleId): Promise<DirectSale | null> {
        const directSale = await this.prisma.directSale.findUnique({
            where: {
                id: id.toString(),
            },
            ...directSaleSelect,
        });

        return directSale === null ? null : DirectSalePrismaRepository.normalize(directSale);
    }

    async search(
        companyId: CompanyId,
        pagination: Pagination<DirectSaleSortOptions>,
        filter: DirectSaleSearchFilter = {}
    ): Promise<PaginatedList<DirectSale>> {
        const {items} = filter;

        const where: PrismaClient.Prisma.DirectSaleWhereInput = {
            sale: {
                companyId: companyId.toString(),
                sellerId: filter.sellerId?.toString(),
                createdAt:
                    filter.createdAt === undefined ? undefined : {gte: filter.createdAt.from, lte: filter.createdAt.to},
                items: items && {
                    some: {
                        saleId: items.saleId?.toString(),
                        productId: items.productId?.toString(),
                        price: items.price === undefined ? undefined : {gte: items.price.from, lte: items.price.to},
                        quantity:
                            items.quantity === undefined
                                ? undefined
                                : {gte: items.quantity.from, lte: items.quantity.to},
                        createdAt:
                            items.createdAt === undefined
                                ? undefined
                                : {gte: items.createdAt.from, lte: items.createdAt.to},
                        canceledAt:
                            items.canceledAt == null
                                ? items.canceledAt
                                : {gte: items.canceledAt.from, lte: items.canceledAt.to},
                        canceledById: items.canceledBy?.toString(),
                    },
                },
            },
            buyerId: filter.buyerId == null ? filter.buyerId : filter.buyerId.toString(),
        };

        const [directSales, totalCount] = await Promise.all([
            this.prisma.directSale.findMany({
                where,
                ...(pagination.cursor && {
                    cursor: {
                        id: pagination.cursor,
                    },
                }),
                ...directSaleSelect,
                take: pagination.limit + 1,
                orderBy: [...this.normalizeSort(pagination.sort).map((sort) => ({sale: sort})), {id: 'asc'}],
            }),
            this.prisma.directSale.count({where}),
        ]);

        return {
            data: directSales
                .slice(0, pagination.limit)
                .map((directSale) => DirectSalePrismaRepository.normalize(directSale)),
            totalCount,
            nextCursor: directSales.length > pagination.limit ? directSales[directSales.length - 1].id : null,
        };
    }

    async save(directSale: DirectSale): Promise<void> {
        const {id, sale, ...directSaleModel} = DirectSalePrismaRepository.denormalize(directSale);

        await this.prisma.sale.upsert({
            where: {
                id,
            },
            create: {
                ...sale,
                items: {
                    createMany: {
                        data: sale.items.map(({saleId, ...rest}) => rest),
                    },
                },
                directSale: {
                    create: directSaleModel,
                },
            },
            update: {
                ...sale,
                items: {
                    upsert: sale.items.map(({saleId, ...saleItem}) => ({
                        where: {
                            id: saleItem.id,
                        },
                        create: saleItem,
                        update: saleItem,
                    })),
                },
                directSale: {
                    update: directSaleModel,
                },
            },
        });
    }
}
