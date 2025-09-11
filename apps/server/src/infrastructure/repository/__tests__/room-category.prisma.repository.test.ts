import {Prisma} from '@prisma/client';
import {mockDeep} from 'jest-mock-extended';
import {DuplicateNameException} from '../../../domain/@shared/exceptions';
import type {Pagination} from '../../../domain/@shared/repository';
import {CompanyId} from '../../../domain/company/entities';
import type {RoomCategory} from '../../../domain/room-category/entities';
import {fakeRoomCategory} from '../../../domain/room-category/entities/__tests__/fake-room-category';
import {DuplicateAcronymException} from '../../../domain/room-category/room-category.exceptions';
import type {
    CategorySearchFilter,
    RoomCategorySortOptions,
} from '../../../domain/room-category/room-category.repository';
import type {PrismaService} from '../prisma';
import type {RoomCategoryModel} from '../room-category.prisma.repository';
import {RoomCategoryPrismaRepository} from '../room-category.prisma.repository';

describe('A room category repository backed by Prisma ORM', () => {
    const prisma = mockDeep<PrismaService>();
    const repository = new RoomCategoryPrismaRepository(prisma);
    const companyId = CompanyId.generate();

    const domainCategories: RoomCategory[] = [
        fakeRoomCategory({
            companyId,
            name: 'POP DANCE',
            acronym: 'PD',
            guestCount: 1,
        }),
        fakeRoomCategory({
            companyId,
            name: 'POP LUSH',
            acronym: 'PL',
            guestCount: 2,
        }),
        fakeRoomCategory({
            companyId,
            name: 'POP LOVE',
            acronym: 'PO',
            guestCount: 3,
        }),
    ];

    const databaseCategories: RoomCategoryModel[] = [
        {
            id: domainCategories[0].id.toString(),
            companyId: domainCategories[0].companyId.toString(),
            name: domainCategories[0].name,
            acronym: domainCategories[0].acronym,
            guestCount: domainCategories[0].guestCount,
            createdAt: domainCategories[0].createdAt,
            updatedAt: domainCategories[0].updatedAt,
        },
        {
            id: domainCategories[1].id.toString(),
            companyId: domainCategories[1].companyId.toString(),
            name: domainCategories[1].name,
            acronym: domainCategories[1].acronym,
            guestCount: domainCategories[1].guestCount,
            createdAt: domainCategories[1].createdAt,
            updatedAt: domainCategories[1].updatedAt,
        },
        {
            id: domainCategories[2].id.toString(),
            companyId: domainCategories[2].companyId.toString(),
            name: domainCategories[2].name,
            acronym: domainCategories[2].acronym,
            guestCount: domainCategories[2].guestCount,
            createdAt: domainCategories[2].createdAt,
            updatedAt: domainCategories[2].updatedAt,
        },
    ];

    it.each([
        [null, null],
        [databaseCategories[0], domainCategories[0]],
    ])('should find a room category by ID', async (databaseCategory, domainCategory) => {
        jest.spyOn(prisma.roomCategory, 'findUnique').mockResolvedValueOnce(databaseCategory);

        await expect(repository.findById(domainCategories[0].id)).resolves.toEqual(domainCategory);

        expect(prisma.roomCategory.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.roomCategory.findUnique).toHaveBeenCalledWith({
            where: {
                id: domainCategories[0].id.toString(),
            },
        });
    });

    it('should search categories', async () => {
        const pagination: Pagination<RoomCategorySortOptions> = {
            limit: 10,
            sort: {
                createdAt: 'desc',
            },
        };

        const filter: CategorySearchFilter = {
            name: 'POP',
        };

        jest.spyOn(prisma.roomCategory, 'findMany').mockResolvedValueOnce(databaseCategories);
        jest.spyOn(prisma.roomCategory, 'count').mockResolvedValueOnce(databaseCategories.length);

        await expect(repository.search(companyId, pagination, filter)).resolves.toEqual({
            data: domainCategories,
            totalCount: databaseCategories.length,
            nextCursor: null,
        });

        expect(prisma.roomCategory.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.roomCategory.findMany).toHaveBeenCalledWith({
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
                acronym: {
                    mode: 'insensitive',
                    contains: undefined,
                },
            },
        });
        expect(prisma.roomCategory.count).toHaveBeenCalledTimes(1);
        expect(prisma.roomCategory.count).toHaveBeenCalledWith({
            where: {
                companyId: companyId.toString(),
                name: {
                    mode: 'insensitive',
                    contains: filter.name,
                },
                acronym: {
                    mode: 'insensitive',
                    contains: undefined,
                },
            },
        });
    });

    it('should paginate room categories', async () => {
        const pagination: Pagination<RoomCategorySortOptions> = {
            limit: 1,
            sort: {},
        };

        jest.spyOn(prisma.roomCategory, 'findMany').mockResolvedValueOnce(
            databaseCategories.slice(0, pagination.limit + 1)
        );
        jest.spyOn(prisma.roomCategory, 'count').mockResolvedValueOnce(databaseCategories.length);

        const result = await repository.search(companyId, pagination);

        expect(result).toEqual({
            data: [domainCategories[0]],
            totalCount: databaseCategories.length,
            nextCursor: databaseCategories[1].id,
        });

        expect(prisma.roomCategory.findMany).toHaveBeenCalledWith({
            where: {
                companyId: companyId.toString(),
                name: {
                    mode: 'insensitive',
                    contains: undefined,
                },
                acronym: {
                    mode: 'insensitive',
                    contains: undefined,
                },
            },
            take: 2,
            orderBy: [
                {
                    id: 'asc',
                },
            ],
        });
    });

    it('should paginate room categories with a cursor', async () => {
        const pagination: Pagination<RoomCategorySortOptions> = {
            limit: 1,
            cursor: 'some-cursor',
            sort: {},
        };

        jest.spyOn(prisma.roomCategory, 'findMany').mockResolvedValueOnce(
            databaseCategories.slice(0, pagination.limit + 1)
        );
        jest.spyOn(prisma.roomCategory, 'count').mockResolvedValueOnce(databaseCategories.length);

        const result = await repository.search(companyId, pagination);

        expect(result).toEqual({
            data: [domainCategories[0]],
            totalCount: databaseCategories.length,
            nextCursor: databaseCategories[1].id,
        });

        expect(prisma.roomCategory.findMany).toHaveBeenCalledWith({
            where: {
                name: {
                    mode: 'insensitive',
                    contains: undefined,
                },
                acronym: {
                    mode: 'insensitive',
                    contains: undefined,
                },
                companyId: companyId.toString(),
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

    it('should save a room category', async () => {
        jest.spyOn(prisma.roomCategory, 'upsert');

        await repository.save(domainCategories[0]);

        expect(prisma.roomCategory.upsert).toHaveBeenCalledTimes(1);
        expect(prisma.roomCategory.upsert).toHaveBeenCalledWith({
            where: {
                id: domainCategories[0].id.toString(),
            },
            create: databaseCategories[0],
            update: databaseCategories[0],
        });
    });

    it('should delete a room category', async () => {
        jest.spyOn(prisma.roomCategory, 'delete');

        await repository.delete(domainCategories[0].id);

        expect(prisma.roomCategory.delete).toHaveBeenCalledTimes(1);
        expect(prisma.roomCategory.delete).toHaveBeenCalledWith({
            where: {
                id: domainCategories[0].id.toString(),
            },
        });
    });

    it('should throw an exception when saving a room category with a duplicate name', async () => {
        jest.spyOn(prisma.roomCategory, 'upsert').mockRejectedValueOnce(
            new Prisma.PrismaClientKnownRequestError('Unique constraint violation', {
                clientVersion: '0.0.0',
                code: 'P2002',
                meta: {
                    target: ['name'],
                },
            })
        );
        await expect(repository.save(domainCategories[0])).rejects.toThrowWithMessage(
            DuplicateNameException,
            'Duplicate room category name.'
        );
    });

    it('should throw an exception when saving a room category with a duplicate acronym', async () => {
        jest.spyOn(prisma.roomCategory, 'upsert').mockRejectedValueOnce(
            new Prisma.PrismaClientKnownRequestError('Unique constraint violation', {
                clientVersion: '0.0.0',
                code: 'P2002',
                meta: {
                    target: ['acronym'],
                },
            })
        );
        await expect(repository.save(domainCategories[0])).rejects.toThrowWithMessage(
            DuplicateAcronymException,
            'Duplicate room category acronym.'
        );
    });

    it('should throw an unknown error when saving a room category', async () => {
        const error = new Error('Unknown error');

        jest.spyOn(prisma.roomCategory, 'upsert').mockRejectedValueOnce(error);

        await expect(repository.save(domainCategories[0])).rejects.toThrow(error);
    });
});
