import {Prisma} from '@prisma/client';
import {mockDeep} from 'jest-mock-extended';
import {DuplicateNameException} from '../../../domain/@shared/exceptions';
import type {Pagination} from '../../../domain/@shared/repository';
import {CompanyId} from '../../../domain/company/entities';
import type {ProductCategorySearchFilter} from '../../../domain/product-category/product-category.repository';
import type {ServiceCategory} from '../../../domain/service-category/entities';
import {fakeServiceCategory} from '../../../domain/service-category/entities/__tests__/fake-service-category';
import type {ServiceCategorySortOptions} from '../../../domain/service-category/service-category.repository';
import type {PrismaService} from '../prisma';
import type {ServiceCategoryModel} from '../service-category.prisma.repository';
import {ServiceCategoryPrismaRepository} from '../service-category.prisma.repository';

describe('A service category backed by prisma ORM', () => {
    const prisma = mockDeep<PrismaService>();
    const repository = new ServiceCategoryPrismaRepository(prisma);
    const companyId = CompanyId.generate();

    const domainServiceCategories: ServiceCategory[] = [
        fakeServiceCategory({companyId}),
        fakeServiceCategory({companyId}),
    ];

    const databaseServiceCategories: ServiceCategoryModel[] = [
        {
            id: domainServiceCategories[0].id.toString(),
            companyId: domainServiceCategories[0].companyId.toString(),
            name: domainServiceCategories[0].name,
            createdAt: domainServiceCategories[0].createdAt,
            updatedAt: domainServiceCategories[0].updatedAt,
        },
        {
            id: domainServiceCategories[1].id.toString(),
            companyId: domainServiceCategories[1].companyId.toString(),
            name: domainServiceCategories[1].name,
            createdAt: domainServiceCategories[1].createdAt,
            updatedAt: domainServiceCategories[1].updatedAt,
        },
    ];

    it.each([
        [null, null],
        [databaseServiceCategories[0], domainServiceCategories[0]],
    ])('should find a service category by ID', async (databaseServiceCategory, domainServiceCategory) => {
        jest.spyOn(prisma.serviceCategory, 'findUnique').mockResolvedValueOnce(databaseServiceCategory);

        await expect(repository.findById(domainServiceCategories[0].id)).resolves.toEqual(domainServiceCategory);

        expect(prisma.serviceCategory.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.serviceCategory.findUnique).toHaveBeenCalledWith({
            where: {
                id: domainServiceCategories[0].id.toString(),
            },
        });
    });

    it('should search service categories', async () => {
        const pagination: Pagination<ServiceCategorySortOptions> = {
            limit: 10,
            sort: {
                createdAt: 'desc',
            },
        };

        const filter: ProductCategorySearchFilter = {
            name: 'Maintenance',
        };

        jest.spyOn(prisma.serviceCategory, 'findMany').mockResolvedValueOnce(databaseServiceCategories);
        jest.spyOn(prisma.serviceCategory, 'count').mockResolvedValueOnce(databaseServiceCategories.length);

        await expect(repository.search(companyId, pagination, filter)).resolves.toEqual({
            data: domainServiceCategories,
            totalCount: databaseServiceCategories.length,
            nextCursor: null,
        });

        expect(prisma.serviceCategory.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.serviceCategory.findMany).toHaveBeenCalledWith({
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
        expect(prisma.serviceCategory.count).toHaveBeenCalledTimes(1);
        expect(prisma.serviceCategory.count).toHaveBeenCalledWith({
            where: {
                companyId: companyId.toString(),
                name: {
                    mode: 'insensitive',
                    contains: filter.name,
                },
            },
        });
    });

    it('should paginate service categories', async () => {
        const pagination: Pagination<ServiceCategorySortOptions> = {
            limit: 1,
            cursor: 'some-cursor',
            sort: {},
        };

        jest.spyOn(prisma.serviceCategory, 'findMany').mockResolvedValueOnce(
            databaseServiceCategories.slice(0, pagination.limit + 1)
        );
        jest.spyOn(prisma.serviceCategory, 'count').mockResolvedValueOnce(databaseServiceCategories.length);

        const result = await repository.search(companyId, pagination);

        expect(result).toEqual({
            data: [domainServiceCategories[0]],
            totalCount: databaseServiceCategories.length,
            nextCursor: databaseServiceCategories[1].id,
        });

        expect(prisma.serviceCategory.findMany).toHaveBeenCalledWith({
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

    it('should save a service category', async () => {
        jest.spyOn(prisma.serviceCategory, 'upsert');

        await repository.save(domainServiceCategories[1]);

        expect(prisma.serviceCategory.upsert).toHaveBeenCalledTimes(1);
        expect(prisma.serviceCategory.upsert).toHaveBeenCalledWith({
            where: {
                id: domainServiceCategories[1].id.toString(),
            },
            create: databaseServiceCategories[1],
            update: databaseServiceCategories[1],
        });
    });

    it('should delete a service category by ID', async () => {
        jest.spyOn(prisma.serviceCategory, 'delete');

        await repository.delete(domainServiceCategories[1].id);

        expect(prisma.serviceCategory.delete).toHaveBeenCalledTimes(1);
        expect(prisma.serviceCategory.delete).toHaveBeenCalledWith({
            where: {
                id: domainServiceCategories[1].id.toString(),
            },
        });
    });

    it('should throw an exception when saving a service category with a duplicated name', async () => {
        jest.spyOn(prisma.serviceCategory, 'upsert').mockRejectedValueOnce(
            new Prisma.PrismaClientKnownRequestError('Unique constraint violation', {
                clientVersion: '0.0.0',
                code: 'P2002',
                meta: {
                    target: ['name'],
                },
            })
        );

        await expect(repository.save(domainServiceCategories[1])).rejects.toThrowWithMessage(
            DuplicateNameException,
            'Duplicate service category name.'
        );
    });

    it('should throw an unknown error when saving a service category', async () => {
        const error = new Error('Unknown error');

        jest.spyOn(prisma.serviceCategory, 'upsert').mockRejectedValueOnce(error);

        await expect(repository.save(domainServiceCategories[1])).rejects.toThrow(error);
    });
});
