import {mockDeep} from 'jest-mock-extended';
import type {Pagination} from '../../../domain/@shared/repository';
import {CompanyId} from '../../../domain/company/entities';
import type {
    DeepCleaningSearchFilter,
    DeepCleaningSortOptions,
} from '../../../domain/deep-cleaning/deep-cleaning.repository';
import {DeepCleaningEndReasonType} from '../../../domain/deep-cleaning/entities';
import {fakeDeepCleaning} from '../../../domain/deep-cleaning/entities/__tests__/fake-deep-cleaning';
import {RoomId} from '../../../domain/room/entities';
import {UserId} from '../../../domain/user/entities';
import type {DeepCleaningModel} from '../deep-cleaning.prisma.repository';
import {DeepCleaningPrismaRepository} from '../deep-cleaning.prisma.repository';
import type {PrismaService} from '../prisma';

describe('A deep cleaning repository backed by Prisma ORM', () => {
    const prisma = mockDeep<PrismaService>();
    const repository = new DeepCleaningPrismaRepository(prisma);
    const companyId = CompanyId.generate();
    const roomId = RoomId.generate();
    const now = new Date();

    const domainDeepCleanings = [
        fakeDeepCleaning({companyId}),
        fakeDeepCleaning({
            companyId,
            endReason: DeepCleaningEndReasonType.FINISHED,
            finishedById: UserId.generate(),
            finishedAt: now,
        }),
    ];

    const databaseDeepCleanings: DeepCleaningModel[] = [
        {
            id: domainDeepCleanings[0].id.toString(),
            endReason: domainDeepCleanings[0].endReason,
            roomStatus: {
                id: domainDeepCleanings[0].id.toString(),
                companyId: domainDeepCleanings[0].companyId.toString(),
                roomId: domainDeepCleanings[0].roomId.toString(),
                startedById: domainDeepCleanings[0].startedById.toString(),
                startedAt: domainDeepCleanings[0].startedAt,
                finishedById: domainDeepCleanings[0].finishedById?.toString() ?? null,
                finishedAt: domainDeepCleanings[0].finishedAt ?? null,
                createdAt: domainDeepCleanings[0].createdAt,
                updatedAt: domainDeepCleanings[0].updatedAt,
            },
        },
        {
            id: domainDeepCleanings[1].id.toString(),
            endReason: domainDeepCleanings[1].endReason,
            roomStatus: {
                id: domainDeepCleanings[1].id.toString(),
                companyId: domainDeepCleanings[1].companyId.toString(),
                roomId: domainDeepCleanings[1].roomId.toString(),
                startedById: domainDeepCleanings[1].startedById.toString(),
                startedAt: domainDeepCleanings[1].startedAt,
                finishedById: domainDeepCleanings[1].finishedById?.toString() ?? null,
                finishedAt: domainDeepCleanings[1].finishedAt ?? null,
                createdAt: domainDeepCleanings[0].createdAt,
                updatedAt: domainDeepCleanings[0].updatedAt,
            },
        },
    ];

    it.each([
        [null, null],
        [databaseDeepCleanings[0], domainDeepCleanings[0]],
    ])('should find a deep cleaning by ID', async (databaseCleaning, domainCleaning) => {
        jest.spyOn(prisma.deepCleaning, 'findUnique').mockResolvedValueOnce(databaseCleaning);

        const result = await repository.findById(domainDeepCleanings[0].id);

        expect(result).toEqual(domainCleaning);
        expect(prisma.deepCleaning.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.deepCleaning.findUnique).toHaveBeenCalledWith({
            where: {
                id: domainDeepCleanings[0].id.toString(),
            },
            include: {
                roomStatus: true,
            },
        });
    });

    it.each([
        [null, null],
        [databaseDeepCleanings[0], domainDeepCleanings[0]],
    ])('should find a deep cleaning by room', async (databaseCleaning, domainCleaning) => {
        jest.spyOn(prisma.deepCleaning, 'findFirst').mockResolvedValueOnce(databaseCleaning);

        const result = await repository.findByRoom(domainDeepCleanings[0].roomId);

        expect(result).toEqual(domainCleaning);
        expect(prisma.deepCleaning.findFirst).toHaveBeenCalledTimes(1);
        expect(prisma.deepCleaning.findFirst).toHaveBeenCalledWith({
            where: {
                roomStatus: {
                    roomId: domainDeepCleanings[0].roomId.toString(),
                    finishedById: null,
                },
            },
            include: {
                roomStatus: true,
            },
        });
    });

    it('should search deep cleanings', async () => {
        const pagination: Pagination<DeepCleaningSortOptions> = {
            limit: 3,
            sort: {
                createdAt: 'asc',
            },
        };

        const filter: DeepCleaningSearchFilter = {
            roomId,
            endReason: DeepCleaningEndReasonType.FINISHED,
        };

        jest.spyOn(prisma.deepCleaning, 'findMany').mockResolvedValueOnce(databaseDeepCleanings);
        jest.spyOn(prisma.deepCleaning, 'count').mockResolvedValueOnce(databaseDeepCleanings.length);

        await expect(repository.search(companyId, pagination, filter)).resolves.toEqual({
            data: domainDeepCleanings,
            totalCount: databaseDeepCleanings.length,
            nextCursor: null,
        });

        expect(prisma.deepCleaning.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.deepCleaning.findMany).toHaveBeenCalledWith({
            where: {
                endReason: DeepCleaningEndReasonType.FINISHED,
                roomStatus: {
                    companyId: companyId.toString(),
                    roomId: filter.roomId?.toString(),
                    startedById: filter.startedById?.toString(),
                    finishedById: filter.finishedById?.toString(),
                },
            },
            take: 4,
            include: {
                roomStatus: true,
            },
            orderBy: [
                {
                    endReason: undefined,
                },
                {
                    roomStatus: {
                        createdAt: 'asc',
                    },
                },
                {
                    id: 'asc',
                },
            ],
        });

        expect(prisma.deepCleaning.count).toHaveBeenCalledTimes(1);
        expect(prisma.deepCleaning.count).toHaveBeenCalledWith({
            where: {
                endReason: filter.endReason,
                roomStatus: {
                    companyId: companyId.toString(),
                    roomId: filter.roomId?.toString(),
                    startedById: filter.startedById?.toString(),
                    finishedById: filter.finishedById?.toString(),
                },
            },
        });
    });

    it('should paginate deep cleanings', async () => {
        const pagination: Pagination<DeepCleaningSortOptions> = {
            limit: 1,
            sort: {
                createdAt: 'asc',
            },
        };

        jest.spyOn(prisma.deepCleaning, 'findMany').mockResolvedValueOnce(
            databaseDeepCleanings.slice(0, pagination.limit + 1)
        );
        jest.spyOn(prisma.deepCleaning, 'count').mockResolvedValueOnce(databaseDeepCleanings.length);

        const result = await repository.search(companyId, pagination);

        expect(result).toEqual({
            data: [domainDeepCleanings[0]],
            totalCount: databaseDeepCleanings.length,
            nextCursor: databaseDeepCleanings[1].id,
        });

        expect(prisma.deepCleaning.findMany).toHaveBeenCalledWith({
            where: {
                endReason: undefined,
                roomStatus: {
                    companyId: companyId.toString(),
                    roomId: undefined,
                    startedById: undefined,
                    endUserId: undefined,
                },
            },
            take: 2,
            include: {
                roomStatus: true,
            },
            orderBy: [
                {
                    endReason: undefined,
                },
                {
                    roomStatus: {
                        createdAt: 'asc',
                    },
                },
                {
                    id: 'asc',
                },
            ],
        });

        jest.spyOn(prisma.deepCleaning, 'findMany').mockResolvedValueOnce(
            databaseDeepCleanings.slice(1, pagination.limit + 2)
        );
        jest.spyOn(prisma.deepCleaning, 'count').mockResolvedValueOnce(databaseDeepCleanings.length);

        await expect(
            repository.search(companyId, {
                ...pagination,
                cursor: result.nextCursor!,
            })
        ).resolves.toEqual({
            data: [domainDeepCleanings[1]],
            totalCount: databaseDeepCleanings.length,
            nextCursor: null,
        });

        expect(prisma.deepCleaning.findMany).toHaveBeenCalledWith({
            where: {
                endReason: undefined,
                roomStatus: {
                    companyId: companyId.toString(),
                    roomId: undefined,
                    startedById: undefined,
                    endUserId: undefined,
                },
            },
            take: 2,
            include: {
                roomStatus: true,
            },
            orderBy: [
                {
                    endReason: undefined,
                },
                {
                    roomStatus: {
                        createdAt: 'asc',
                    },
                },
                {
                    id: 'asc',
                },
            ],
        });
    });

    it('should save a deep cleaning', async () => {
        const {id, roomStatus, ...deepCleaningModel} = databaseDeepCleanings[1];

        jest.spyOn(prisma.roomStatus, 'upsert');

        await repository.save(domainDeepCleanings[1]);

        expect(prisma.roomStatus.upsert).toHaveBeenCalledTimes(1);
        expect(prisma.roomStatus.upsert).toHaveBeenCalledWith({
            where: {
                id,
            },
            create: {
                ...roomStatus,
                deepCleaning: {
                    create: {
                        ...deepCleaningModel,
                    },
                },
            },
            update: {
                ...roomStatus,
                deepCleaning: {
                    update: deepCleaningModel,
                },
            },
        });
    });

    it('should rethrow an unknown error when saving a deep cleaning', async () => {
        jest.spyOn(prisma.roomStatus, 'upsert').mockRejectedValue(new Error('Generic error'));
        await expect(repository.save(domainDeepCleanings[0])).rejects.toThrowWithMessage(Error, 'Generic error');
    });
});
