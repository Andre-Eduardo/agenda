import {mockDeep} from 'jest-mock-extended';
import type {Pagination} from '../../../domain/@shared/repository';
import {CompanyId} from '../../../domain/company/entities';
import {PersonId} from '../../../domain/person/entities';
import type {DirectSaleSearchFilter, DirectSaleSortOptions} from '../../../domain/sale/direct-sale.repository';
import type {DirectSale} from '../../../domain/sale/entities';
import {SaleId} from '../../../domain/sale/entities';
import {fakeDirectSale} from '../../../domain/sale/entities/__tests__/fake-direct-sale';
import {fakeSaleItem} from '../../../domain/sale/entities/__tests__/fake-sale-item';
import {UserId} from '../../../domain/user/entities';
import type {DirectSaleModel} from '../direct-sale.prisma.repository';
import {DirectSalePrismaRepository} from '../direct-sale.prisma.repository';
import type {PrismaService} from '../prisma';

describe('A direct sale repository backed by Prisma ORM', () => {
    const prisma = mockDeep<PrismaService>();
    const repository = new DirectSalePrismaRepository(prisma);

    const companyId = CompanyId.generate();
    const saleId = SaleId.generate();
    const sellerId = UserId.generate();
    const buyerId = PersonId.generate();
    const include = {
        sale: {
            include: {
                items: true,
            },
        },
    };

    const domainDirectSales: DirectSale[] = [
        fakeDirectSale({
            id: saleId,
            sellerId,
            buyerId,
            items: [
                fakeSaleItem({
                    saleId,
                    price: 10.2,
                    quantity: 1,
                    note: null,
                    canceledAt: null,
                    canceledBy: null,
                    canceledReason: null,
                    createdAt: new Date(1000),
                    updatedAt: new Date(1000),
                }),
            ],
            note: 'note',
            createdAt: new Date(1000),
            updatedAt: new Date(1000),
        }),
        fakeDirectSale({
            id: saleId,
            sellerId,
            buyerId: null,
            items: [
                fakeSaleItem({
                    saleId,
                    price: 3.3,
                    quantity: 3,
                    note: null,
                    canceledAt: new Date(5000),
                    canceledBy: UserId.generate(),
                    canceledReason: null,
                    createdAt: new Date(2000),
                    updatedAt: new Date(2000),
                }),
            ],
            note: null,
            createdAt: new Date(2000),
            updatedAt: new Date(2000),
        }),
    ];

    const databaseDirectSales: DirectSaleModel[] = domainDirectSales.map((domainDirectSale) => ({
        id: domainDirectSale.id.toString(),
        buyerId: domainDirectSale.buyerId?.toString() ?? null,
        sale: {
            id: domainDirectSale.id.toString(),
            companyId: domainDirectSale.companyId.toString(),
            sellerId: domainDirectSale.sellerId.toString(),
            note: domainDirectSale.note,
            createdAt: domainDirectSale.createdAt,
            updatedAt: domainDirectSale.updatedAt,
            items: domainDirectSale.items.map((prod) => ({
                id: prod.id.toString(),
                saleId: prod.saleId.toString(),
                productId: prod.productId.toString(),
                price: prod.price,
                quantity: prod.quantity,
                note: prod.note,
                canceledAt: prod.canceledAt,
                canceledById: prod.canceledBy?.toString() ?? null,
                canceledReason: prod.canceledReason,
                createdAt: prod.createdAt,
                updatedAt: prod.updatedAt,
            })),
        },
    }));

    it.each([
        [null, null],
        [databaseDirectSales[0], domainDirectSales[0]],
        [databaseDirectSales[1], domainDirectSales[1]],
    ])('should find a direct sale by ID', async (databaseDirectSale, domainDirectSale) => {
        jest.spyOn(prisma.directSale, 'findUnique').mockResolvedValueOnce(databaseDirectSale);

        await expect(repository.findById(domainDirectSales[0].id)).resolves.toEqual(domainDirectSale);

        expect(prisma.directSale.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.directSale.findUnique).toHaveBeenCalledWith({
            where: {
                id: domainDirectSales[0].id.toString(),
            },
            include,
        });
    });

    it('should search direct sales', async () => {
        const pagination: Pagination<DirectSaleSortOptions> = {
            limit: 5,
            sort: {
                createdAt: 'desc',
            },
        };

        const filter: DirectSaleSearchFilter = {
            buyerId,
            sellerId,
            createdAt: {
                from: new Date(1000),
                to: new Date(2000),
            },
            items: {
                saleId,
                quantity: {
                    from: 1,
                    to: 3,
                },
                price: {
                    from: 2,
                    to: 10.5,
                },
                createdAt: {
                    from: new Date(1000),
                    to: new Date(2000),
                },
                canceledAt: {
                    from: new Date(5000),
                    to: new Date(5000),
                },
            },
        };

        jest.spyOn(prisma.directSale, 'findMany').mockResolvedValueOnce(databaseDirectSales);
        jest.spyOn(prisma.directSale, 'count').mockResolvedValueOnce(databaseDirectSales.length);

        await expect(repository.search(companyId, pagination, filter)).resolves.toEqual({
            data: domainDirectSales,
            totalCount: databaseDirectSales.length,
            nextCursor: null,
        });

        expect(prisma.directSale.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.directSale.findMany).toHaveBeenCalledWith({
            where: {
                buyerId: buyerId.toString(),
                sale: {
                    companyId: companyId.toString(),
                    sellerId: sellerId.toString(),
                    createdAt: {gte: new Date(1000), lte: new Date(2000)},
                    items: {
                        some: {
                            saleId: saleId.toString(),
                            price: {gte: 2, lte: 10.5},
                            quantity: {gte: 1, lte: 3},
                            createdAt: {gte: new Date(1000), lte: new Date(2000)},
                            canceledAt: {gte: new Date(5000), lte: new Date(5000)},
                        },
                    },
                },
            },
            include,
            take: 6,
            orderBy: [
                {
                    sale: {
                        createdAt: 'desc',
                    },
                },
                {
                    id: 'asc',
                },
            ],
        });
        expect(prisma.directSale.count).toHaveBeenCalledTimes(1);
        expect(prisma.directSale.count).toHaveBeenCalledWith({
            where: {
                buyerId: buyerId.toString(),
                sale: {
                    companyId: companyId.toString(),
                    sellerId: sellerId.toString(),
                    createdAt: {gte: new Date(1000), lte: new Date(2000)},
                    items: {
                        some: {
                            saleId: saleId.toString(),
                            price: {gte: 2, lte: 10.5},
                            quantity: {gte: 1, lte: 3},
                            createdAt: {gte: new Date(1000), lte: new Date(2000)},
                            canceledAt: {gte: new Date(5000), lte: new Date(5000)},
                        },
                    },
                },
            },
        });
    });

    it.each([
        [undefined, undefined],
        [{items: {}}, {items: {some: {}}}],
    ])('should paginate direct sales', async (filter, expected) => {
        const pagination: Pagination<DirectSaleSortOptions> = {
            limit: 1,
            cursor: 'some-cursor',
            sort: {},
        };

        jest.spyOn(prisma.directSale, 'findMany').mockResolvedValueOnce(
            databaseDirectSales.slice(0, pagination.limit + 1)
        );
        jest.spyOn(prisma.directSale, 'count').mockResolvedValueOnce(databaseDirectSales.length);

        const result = await repository.search(companyId, pagination, filter);

        expect(result).toEqual({
            data: [domainDirectSales[0]],
            totalCount: databaseDirectSales.length,
            nextCursor: databaseDirectSales[1].id,
        });

        expect(prisma.directSale.findMany).toHaveBeenCalledWith({
            where: {
                sale: {
                    companyId: companyId.toString(),
                    ...expected,
                },
            },
            cursor: {
                id: pagination.cursor,
            },
            include,
            take: 2,
            orderBy: [
                {
                    id: 'asc',
                },
            ],
        });
    });

    it.each([
        [databaseDirectSales[0], domainDirectSales[0]],
        [databaseDirectSales[1], domainDirectSales[1]],
    ])('should save a direct sale', async (databaseDirectSale, domainDirectSale) => {
        const {id, sale, ...directSaleModel} = databaseDirectSale;

        jest.spyOn(prisma.sale, 'upsert');

        await repository.save(domainDirectSale);

        expect(prisma.sale.upsert).toHaveBeenCalledTimes(1);
        expect(prisma.sale.upsert).toHaveBeenCalledWith({
            where: {
                id,
            },
            create: {
                ...sale,
                items: {
                    createMany: {
                        data: sale.items.map(({saleId: _, ...rest}) => rest),
                    },
                },
                directSale: {
                    create: directSaleModel,
                },
            },
            update: {
                ...sale,
                items: {
                    upsert: sale.items.map(({saleId: _, ...saleItem}) => ({
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
    });

    it('should throw an unknown error when saving a direct sale', async () => {
        const error = new Error('Unknown error');

        jest.spyOn(prisma.sale, 'upsert').mockRejectedValueOnce(error);

        await expect(repository.save(domainDirectSales[0])).rejects.toThrow(error);
    });
});
