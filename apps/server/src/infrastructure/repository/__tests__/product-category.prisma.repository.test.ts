import {Prisma} from '@prisma/client';
import {mockDeep} from 'jest-mock-extended';
import {DuplicateNameException} from '../../../domain/@shared/exceptions';
import type {Pagination} from '../../../domain/@shared/repository';
import {CompanyId} from '../../../domain/company/entities';
import type {ProductCategory} from '../../../domain/product-category/entities';
import {fakeProductCategory} from '../../../domain/product-category/entities/__tests__/fake-product-category';
import type {
    ProductCategorySearchFilter,
    ProductCategorySortOptions,
} from '../../../domain/product-category/product-category.repository';
import type {PrismaService} from '../prisma';
import type {ProductCategoryModel} from '../product-category.prisma-repository';
import {ProductCategoryPrismaRepository} from '../product-category.prisma-repository';

describe('A product category backed by prisma ORM', () => {
    const prisma = mockDeep<PrismaService>();
    const repository = new ProductCategoryPrismaRepository(prisma);
    const companyId = CompanyId.generate();

    const domainProductCategories: ProductCategory[] = [
        fakeProductCategory({
            companyId,
            name: 'Drinks',
        }),
        fakeProductCategory({
            companyId,
            name: 'Erotic',
        }),
        fakeProductCategory({
            companyId,
            name: 'Cleaning',
        }),
    ];

    const databaseProductCategories: ProductCategoryModel[] = [
        {
            id: domainProductCategories[0].id.toString(),
            companyId: domainProductCategories[0].companyId.toString(),
            name: domainProductCategories[0].name,
            createdAt: domainProductCategories[0].createdAt,
            updatedAt: domainProductCategories[0].updatedAt,
        },
        {
            id: domainProductCategories[1].id.toString(),
            companyId: domainProductCategories[1].companyId.toString(),
            name: domainProductCategories[1].name,
            createdAt: domainProductCategories[1].createdAt,
            updatedAt: domainProductCategories[1].updatedAt,
        },
        {
            id: domainProductCategories[2].id.toString(),
            companyId: domainProductCategories[2].companyId.toString(),
            name: domainProductCategories[2].name,
            createdAt: domainProductCategories[2].createdAt,
            updatedAt: domainProductCategories[2].updatedAt,
        },
    ];

    it('should save a product category', async () => {
        jest.spyOn(prisma.productCategory, 'upsert');

        await repository.save(domainProductCategories[1]);

        expect(prisma.productCategory.upsert).toHaveBeenCalledTimes(1);
        expect(prisma.productCategory.upsert).toHaveBeenCalledWith({
            where: {
                id: domainProductCategories[1].id.toString(),
            },
            create: databaseProductCategories[1],
            update: databaseProductCategories[1],
        });
    });

    it.each([
        [null, null],
        [databaseProductCategories[0], domainProductCategories[0]],
    ])('should find a product category by ID', async (databaseProductCategory, domainProductCategory) => {
        jest.spyOn(prisma.productCategory, 'findUnique').mockResolvedValueOnce(databaseProductCategory);

        await expect(repository.findById(domainProductCategories[0].id)).resolves.toEqual(domainProductCategory);

        expect(prisma.productCategory.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.productCategory.findUnique).toHaveBeenCalledWith({
            where: {
                id: domainProductCategories[0].id.toString(),
            },
        });
    });

    it('should search product categories', async () => {
        const pagination: Pagination<ProductCategorySortOptions> = {
            limit: 10,
            sort: {
                createdAt: 'desc',
            },
        };

        const filter: ProductCategorySearchFilter = {
            name: 'Cleaning',
        };

        jest.spyOn(prisma.productCategory, 'findMany').mockResolvedValueOnce(databaseProductCategories);
        jest.spyOn(prisma.productCategory, 'count').mockResolvedValueOnce(databaseProductCategories.length);

        await expect(repository.search(companyId, pagination, filter)).resolves.toEqual({
            data: domainProductCategories,
            totalCount: databaseProductCategories.length,
            nextCursor: null,
        });

        expect(prisma.productCategory.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.productCategory.findMany).toHaveBeenCalledWith({
            take: 11,
            orderBy: [
                {
                    createdAt: 'desc',
                },
                {
                    id: 'asc',
                },
            ],
            where: {
                companyId: companyId.toString(),
                name: {
                    mode: 'insensitive',
                    contains: filter.name,
                },
            },
        });
        expect(prisma.productCategory.count).toHaveBeenCalledTimes(1);
        expect(prisma.productCategory.count).toHaveBeenCalledWith({
            where: {
                companyId: companyId.toString(),
                name: {
                    mode: 'insensitive',
                    contains: filter.name,
                },
            },
        });
    });

    it('should paginate product categories', async () => {
        const pagination: Pagination<ProductCategorySortOptions> = {
            limit: 1,
            cursor: 'some-cursor',
            sort: {},
        };

        jest.spyOn(prisma.productCategory, 'findMany').mockResolvedValueOnce(
            databaseProductCategories.slice(0, pagination.limit + 1)
        );
        jest.spyOn(prisma.productCategory, 'count').mockResolvedValueOnce(databaseProductCategories.length);

        const result = await repository.search(companyId, pagination);

        expect(result).toEqual({
            data: [domainProductCategories[0]],
            totalCount: databaseProductCategories.length,
            nextCursor: databaseProductCategories[1].id,
        });

        expect(prisma.productCategory.findMany).toHaveBeenCalledWith({
            where: {
                companyId: companyId.toString(),
                name: {
                    mode: 'insensitive',
                    contains: undefined,
                },
            },
            cursor: {
                id: pagination.cursor,
            },
            take: 2,
            orderBy: [
                {
                    id: 'asc',
                },
            ],
        });
    });

    it('should delete a product category by ID', async () => {
        jest.spyOn(prisma.productCategory, 'delete');

        await repository.delete(domainProductCategories[2].id);

        expect(prisma.productCategory.delete).toHaveBeenCalledTimes(1);
        expect(prisma.productCategory.delete).toHaveBeenCalledWith({
            where: {
                id: domainProductCategories[2].id.toString(),
            },
        });
    });

    it('should throw an exception when saving a product with a duplicate name', async () => {
        jest.spyOn(prisma.productCategory, 'upsert').mockRejectedValueOnce(
            new Prisma.PrismaClientKnownRequestError('Unique constraint violation', {
                clientVersion: '0.0.0',
                code: 'P2002',
                meta: {
                    target: ['name'],
                },
            })
        );

        await expect(repository.save(domainProductCategories[1])).rejects.toThrowWithMessage(
            DuplicateNameException,
            'Duplicate product category name.'
        );
    });

    it('should throw an unknown error when saving a product category', async () => {
        const error = new Error('Unknown error');

        jest.spyOn(prisma.productCategory, 'upsert').mockRejectedValueOnce(error);

        await expect(repository.save(domainProductCategories[1])).rejects.toThrow(error);
    });
});
