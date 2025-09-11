import {Prisma} from '@prisma/client';
import {mockDeep} from 'jest-mock-extended';
import type {Pagination} from '../../../domain/@shared/repository';
import {CompanyId} from '../../../domain/company/entities';
import type {Product} from '../../../domain/product/entities';
import {fakeProduct} from '../../../domain/product/entities/__tests__/fake-product';
import {DuplicateCodeException} from '../../../domain/product/product.exceptions';
import type {ProductSearchFilter, ProductSortOptions} from '../../../domain/product/product.repository';
import {ProductCategoryId} from '../../../domain/product-category/entities';
import type {PrismaService} from '../prisma';
import type {ProductModel} from '../product.prisma.repository';
import {ProductPrismaRepository} from '../product.prisma.repository';

describe('A product repository backed by Prisma ORM', () => {
    const prisma = mockDeep<PrismaService>();
    const repository = new ProductPrismaRepository(prisma);

    const companyId = CompanyId.generate();

    const domainProducts: Product[] = [
        fakeProduct({
            name: 'Product 1',
            code: 1,
            price: 100,
        }),
        fakeProduct({
            name: 'Product 2',
            code: 2,
            price: 200,
        }),
    ];

    const databaseProducts: ProductModel[] = [
        {
            id: domainProducts[0].id.toString(),
            companyId: domainProducts[0].companyId.toString(),
            categoryId: domainProducts[0].categoryId.toString(),
            name: domainProducts[0].name,
            code: domainProducts[0].code,
            price: domainProducts[0].price,
            createdAt: domainProducts[0].createdAt,
            updatedAt: domainProducts[0].updatedAt,
        },
        {
            id: domainProducts[1].id.toString(),
            companyId: domainProducts[1].companyId.toString(),
            categoryId: domainProducts[1].categoryId.toString(),
            name: domainProducts[1].name,
            code: domainProducts[1].code,
            price: domainProducts[1].price,
            createdAt: domainProducts[1].createdAt,
            updatedAt: domainProducts[1].updatedAt,
        },
    ];

    it.each([
        [null, null],
        [databaseProducts[0], domainProducts[0]],
    ])('should find a product by ID', async (databaseProduct, domainProduct) => {
        jest.spyOn(prisma.product, 'findUnique').mockResolvedValueOnce(databaseProduct);

        await expect(repository.findById(domainProducts[0].id)).resolves.toEqual(domainProduct);

        expect(prisma.product.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.product.findUnique).toHaveBeenCalledWith({
            where: {
                id: domainProducts[0].id.toString(),
            },
        });
    });

    it('should search products', async () => {
        const pagination: Pagination<ProductSortOptions> = {
            limit: 10,
            sort: {
                createdAt: 'desc',
            },
        };

        const filter: ProductSearchFilter = {
            name: 'Product',
            code: undefined,
            price: undefined,
        };

        jest.spyOn(prisma.product, 'findMany').mockResolvedValueOnce(databaseProducts);
        jest.spyOn(prisma.product, 'count').mockResolvedValueOnce(databaseProducts.length);

        await expect(repository.search(companyId, pagination, filter)).resolves.toEqual({
            data: domainProducts,
            totalCount: databaseProducts.length,
            nextCursor: null,
        });

        expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.product.findMany).toHaveBeenCalledWith({
            where: {
                categoryId: undefined,
                companyId: companyId.toString(),
                name: {
                    mode: 'insensitive',
                    contains: filter.name,
                },
                code: undefined,
                price: undefined,
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

    it('should paginate products', async () => {
        const pagination: Pagination<ProductSortOptions> = {
            limit: 1,
            cursor: 'some-cursor',
            sort: {},
        };

        const filter = {
            name: 'Product',
            code: undefined,
            price: undefined,
            categoryId: ProductCategoryId.generate(),
        };

        jest.spyOn(prisma.product, 'findMany').mockResolvedValueOnce(databaseProducts.slice(0, pagination.limit + 1));
        jest.spyOn(prisma.product, 'count').mockResolvedValueOnce(databaseProducts.length);

        const result = await repository.search(companyId, pagination, filter);

        expect(result).toEqual({
            data: [domainProducts[0]],
            totalCount: databaseProducts.length,
            nextCursor: databaseProducts[1].id,
        });

        expect(prisma.product.findMany).toHaveBeenCalledWith({
            where: {
                categoryId: filter.categoryId.toString(),
                companyId: companyId.toString(),
                name: {
                    mode: 'insensitive',
                    contains: filter.name,
                },
                code: undefined,
                price: undefined,
            },
            cursor: {
                id: pagination.cursor,
            },
            take: 2,
            orderBy: [{id: 'asc'}],
        });
    });

    it('should save a product', async () => {
        jest.spyOn(prisma.product, 'upsert');

        await repository.save(domainProducts[1]);

        expect(prisma.product.upsert).toHaveBeenCalledTimes(1);
        expect(prisma.product.upsert).toHaveBeenCalledWith({
            where: {
                id: domainProducts[1].id.toString(),
            },
            update: databaseProducts[1],
            create: databaseProducts[1],
        });
    });

    it('should delete a product by ID', async () => {
        jest.spyOn(prisma.product, 'delete');

        await repository.delete(domainProducts[0].id);

        expect(prisma.product.delete).toHaveBeenCalledTimes(1);
        expect(prisma.product.delete).toHaveBeenCalledWith({
            where: {
                id: domainProducts[0].id.toString(),
            },
        });
    });

    it('should throw an exception when saving a product with a duplicate code', async () => {
        jest.spyOn(prisma.product, 'upsert').mockRejectedValueOnce(
            new Prisma.PrismaClientKnownRequestError('Unique constraint violation', {
                clientVersion: '0.0.0',
                code: 'P2002',
                meta: {
                    target: ['code'],
                },
            })
        );

        await expect(repository.save(domainProducts[0])).rejects.toThrowWithMessage(
            DuplicateCodeException,
            'Duplicate product code.'
        );
    });

    it('should rethrow an unknown error when saving a product', async () => {
        const error = new Error('Unknown error');

        jest.spyOn(prisma.product, 'upsert').mockRejectedValueOnce(error);

        await expect(repository.save(domainProducts[0])).rejects.toThrow(error);
    });
});
