import {mockDeep} from 'jest-mock-extended';
import type {Pagination} from '../../../domain/@shared/repository';
import type {CleaningSearchFilter, CleaningSortOptions} from '../../../domain/cleaning/cleaning.repository';
import {CleaningEndReasonType} from '../../../domain/cleaning/entities';
import {fakeCleaning} from '../../../domain/cleaning/entities/__tests__/fake-cleaning';
import {CompanyId} from '../../../domain/company/entities';
import {UserId} from '../../../domain/user/entities';
import type {CleaningModel} from '../cleaning.prisma.repository';
import {CleaningPrismaRepository} from '../cleaning.prisma.repository';
import type {PrismaService} from '../prisma';

describe('A cleaning repository backed by Prisma ORM', () => {
    const prisma = mockDeep<PrismaService>();
    const repository = new CleaningPrismaRepository(prisma);
    const companyId = CompanyId.generate();
    const now = new Date();

    const domainCleanings = [
        fakeCleaning({companyId}),
        fakeCleaning({
            companyId,
            endReason: CleaningEndReasonType.FINISHED,
            finishedById: UserId.generate(),
            finishedAt: now,
        }),
    ];

    const databaseCleanings: CleaningModel[] = [
        {
            id: domainCleanings[0].id.toString(),
            endReason: domainCleanings[0].endReason,
            roomStatus: {
                id: domainCleanings[0].id.toString(),
                companyId: domainCleanings[0].companyId.toString(),
                roomId: domainCleanings[0].roomId.toString(),
                startedById: domainCleanings[0].startedById.toString(),
                startedAt: domainCleanings[0].startedAt,
                finishedById:
                    domainCleanings[0].finishedById === null ? null : domainCleanings[0].finishedById.toString(),
                finishedAt: domainCleanings[0].finishedAt ?? null,
                createdAt: domainCleanings[0].createdAt,
                updatedAt: domainCleanings[0].updatedAt,
            },
        },
        {
            id: domainCleanings[1].id.toString(),
            endReason: domainCleanings[1].endReason,
            roomStatus: {
                id: domainCleanings[1].id.toString(),
                companyId: domainCleanings[1].companyId.toString(),
                roomId: domainCleanings[1].roomId.toString(),
                startedById: domainCleanings[1].startedById.toString(),
                startedAt: domainCleanings[1].startedAt,
                finishedById:
                    domainCleanings[1].finishedById === null ? null : domainCleanings[1].finishedById.toString(),
                finishedAt: domainCleanings[1].finishedAt ?? null,
                createdAt: domainCleanings[0].createdAt,
                updatedAt: domainCleanings[0].updatedAt,
            },
        },
    ];

    it.each([
        [null, null],
        [databaseCleanings[0], domainCleanings[0]],
    ])('should find a cleaning by ID', async (databaseCleaning, domainCleaning) => {
        jest.spyOn(prisma.cleaning, 'findUnique').mockResolvedValueOnce(databaseCleaning);

        const result = await repository.findById(domainCleanings[0].id);

        expect(result).toEqual(domainCleaning);
        expect(prisma.cleaning.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.cleaning.findUnique).toHaveBeenCalledWith({
            where: {
                id: domainCleanings[0].id.toString(),
            },
            include: {
                roomStatus: true,
            },
        });
    });

    it.each([
        [null, null],
        [databaseCleanings[0], domainCleanings[0]],
    ])('should find a cleaning by room', async (databaseCleaning, domainCleaning) => {
        jest.spyOn(prisma.cleaning, 'findFirst').mockResolvedValueOnce(databaseCleaning);

        const result = await repository.findByRoom(domainCleanings[0].roomId);

        expect(result).toEqual(domainCleaning);
        expect(prisma.cleaning.findFirst).toHaveBeenCalledTimes(1);
        expect(prisma.cleaning.findFirst).toHaveBeenCalledWith({
            where: {
                roomStatus: {
                    roomId: domainCleanings[0].roomId.toString(),
                    finishedById: null,
                },
            },
            include: {
                roomStatus: true,
            },
        });
    });

    it('should search cleanings', async () => {
        const pagination: Pagination<CleaningSortOptions> = {
            limit: 3,
            sort: {
                createdAt: 'asc',
            },
        };

        const filter: CleaningSearchFilter = {
            roomId: domainCleanings[0].roomId,
            endReason: CleaningEndReasonType.FINISHED,
        };

        jest.spyOn(prisma.cleaning, 'findMany').mockResolvedValueOnce(databaseCleanings);
        jest.spyOn(prisma.cleaning, 'count').mockResolvedValueOnce(databaseCleanings.length);

        await expect(repository.search(companyId, pagination, filter)).resolves.toEqual({
            data: domainCleanings,
            totalCount: databaseCleanings.length,
            nextCursor: null,
        });

        expect(prisma.cleaning.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.cleaning.findMany).toHaveBeenCalledWith({
            where: {
                endReason: CleaningEndReasonType.FINISHED,
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

        expect(prisma.cleaning.count).toHaveBeenCalledTimes(1);
        expect(prisma.cleaning.count).toHaveBeenCalledWith({
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

    it('should paginate cleanings', async () => {
        const pagination: Pagination<CleaningSortOptions> = {
            limit: 1,
            sort: {
                createdAt: 'asc',
            },
        };

        jest.spyOn(prisma.cleaning, 'findMany').mockResolvedValueOnce(databaseCleanings.slice(0, pagination.limit + 1));
        jest.spyOn(prisma.cleaning, 'count').mockResolvedValueOnce(databaseCleanings.length);

        const result = await repository.search(companyId, pagination);

        expect(result).toEqual({
            data: [domainCleanings[0]],
            totalCount: databaseCleanings.length,
            nextCursor: databaseCleanings[1].id,
        });

        expect(prisma.cleaning.findMany).toHaveBeenCalledWith({
            where: {
                endReason: undefined,
                roomStatus: {
                    companyId: companyId.toString(),
                    roomId: undefined,
                    startedById: undefined,
                    finishedById: undefined,
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

        jest.spyOn(prisma.cleaning, 'findMany').mockResolvedValueOnce(databaseCleanings.slice(1, pagination.limit + 2));
        jest.spyOn(prisma.cleaning, 'count').mockResolvedValueOnce(databaseCleanings.length);

        await expect(
            repository.search(companyId, {
                ...pagination,
                cursor: result.nextCursor!,
            })
        ).resolves.toEqual({
            data: [domainCleanings[1]],
            totalCount: databaseCleanings.length,
            nextCursor: null,
        });

        expect(prisma.cleaning.findMany).toHaveBeenCalledWith({
            where: {
                endReason: undefined,
                roomStatus: {
                    companyId: companyId.toString(),
                    roomId: undefined,
                    startedById: undefined,
                    finishedById: undefined,
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

    it('should save a cleaning', async () => {
        const {id, roomStatus, ...cleaningModel} = databaseCleanings[1];

        jest.spyOn(prisma.roomStatus, 'upsert');

        await repository.save(domainCleanings[1]);

        expect(prisma.roomStatus.upsert).toHaveBeenCalledTimes(1);
        expect(prisma.roomStatus.upsert).toHaveBeenCalledWith({
            where: {
                id,
            },
            create: {
                ...roomStatus,
                cleaning: {
                    create: {
                        ...cleaningModel,
                    },
                },
            },
            update: {
                ...roomStatus,
                cleaning: {
                    update: cleaningModel,
                },
            },
        });
    });

    it('should rethrow an unknown error when saving a cleaning', async () => {
        jest.spyOn(prisma.roomStatus, 'upsert').mockRejectedValue(new Error('Generic error'));
        await expect(repository.save(domainCleanings[0])).rejects.toThrowWithMessage(Error, 'Generic error');
    });
});
