import {mockDeep} from 'jest-mock-extended';
import type {Pagination} from '../../../domain/@shared/repository';
import type {BlockadeSearchFilter, BlockadeSortOptions} from '../../../domain/blockade/blockade.repository';
import {fakeBlockade} from '../../../domain/blockade/entities/__tests__/fake-blockade';
import {CompanyId} from '../../../domain/company/entities';
import {RoomId} from '../../../domain/room/entities';
import {UserId} from '../../../domain/user/entities';
import type {BlockadeModel} from '../blockade.prisma.repository';
import {BlockadePrismaRepository} from '../blockade.prisma.repository';
import type {PrismaService} from '../prisma';

describe('A blockade repository backed by Prisma ORM', () => {
    const prisma = mockDeep<PrismaService>();
    const repository = new BlockadePrismaRepository(prisma);
    const companyId = CompanyId.generate();
    const roomId = RoomId.generate();
    const now = new Date();

    const domainBlockades = [
        fakeBlockade({
            companyId,
            roomId,
        }),
        fakeBlockade({
            companyId,
            finishedById: UserId.generate(),
            finishedAt: now,
        }),
    ];

    const databaseBlockades: BlockadeModel[] = [
        {
            id: domainBlockades[0].id.toString(),
            note: domainBlockades[0].note,
            defects: domainBlockades[0].defects.map((defectId) => ({
                defectId: defectId.toString(),
                blockadeId: domainBlockades[0].id.toString(),
            })),
            roomStatus: {
                id: domainBlockades[0].id.toString(),
                companyId: domainBlockades[0].companyId.toString(),
                roomId: domainBlockades[0].roomId.toString(),
                startedById: domainBlockades[0].startedById.toString(),
                startedAt: domainBlockades[0].startedAt,
                finishedById: domainBlockades[0].finishedById?.toString() ?? null,
                finishedAt: domainBlockades[0].finishedAt ?? null,
                createdAt: domainBlockades[0].createdAt,
                updatedAt: domainBlockades[0].updatedAt,
            },
        },
        {
            id: domainBlockades[1].id.toString(),
            note: domainBlockades[1].note,
            defects: domainBlockades[1].defects.map((defectId) => ({
                defectId: defectId.toString(),
                blockadeId: domainBlockades[1].id.toString(),
            })),
            roomStatus: {
                id: domainBlockades[1].id.toString(),
                companyId: domainBlockades[1].companyId.toString(),
                roomId: domainBlockades[1].roomId.toString(),
                startedById: domainBlockades[1].startedById.toString(),
                startedAt: domainBlockades[1].startedAt,
                finishedById: domainBlockades[1].finishedById?.toString() ?? null,
                finishedAt: domainBlockades[1].finishedAt ?? null,
                createdAt: domainBlockades[1].createdAt,
                updatedAt: domainBlockades[1].updatedAt,
            },
        },
    ];

    it.each([
        [null, null],
        [databaseBlockades[0], domainBlockades[0]],
    ])('should find a blockade by ID', async (databaseBlockade, domainBlockade) => {
        jest.spyOn(prisma.blockade, 'findUnique').mockResolvedValueOnce(databaseBlockade);

        const result = await repository.findById(domainBlockades[0].id);

        expect(result).toEqual(domainBlockade);
        expect(prisma.blockade.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.blockade.findUnique).toHaveBeenCalledWith({
            where: {
                id: domainBlockades[0].id.toString(),
            },
            include: {
                roomStatus: true,
                defects: true,
            },
        });
    });

    it.each([
        [null, null],
        [databaseBlockades[0], domainBlockades[0]],
    ])('should find a blockade by room', async (databaseBlockade, domainBlockade) => {
        jest.spyOn(prisma.blockade, 'findFirst').mockResolvedValueOnce(databaseBlockade);

        const result = await repository.findByRoom(domainBlockades[0].roomId);

        expect(result).toEqual(domainBlockade);
        expect(prisma.blockade.findFirst).toHaveBeenCalledTimes(1);
        expect(prisma.blockade.findFirst).toHaveBeenCalledWith({
            where: {
                roomStatus: {
                    roomId: domainBlockades[0].roomId.toString(),
                    finishedById: null,
                },
            },
            include: {
                roomStatus: true,
                defects: true,
            },
        });
    });

    it('should search blockades', async () => {
        const pagination: Pagination<BlockadeSortOptions> = {
            limit: 2,
            sort: {
                createdAt: 'asc',
            },
        };

        const filter: BlockadeSearchFilter = {
            roomId,
        };

        jest.spyOn(prisma.blockade, 'findMany').mockResolvedValueOnce(databaseBlockades);
        jest.spyOn(prisma.blockade, 'count').mockResolvedValueOnce(databaseBlockades.length);

        await expect(repository.search(companyId, pagination, filter)).resolves.toEqual({
            data: domainBlockades,
            totalCount: databaseBlockades.length,
            nextCursor: null,
        });

        expect(prisma.blockade.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.blockade.findMany).toHaveBeenCalledWith({
            where: {
                note: {
                    contains: filter.note,
                    mode: 'insensitive',
                },
                roomStatus: {
                    companyId: companyId.toString(),
                    roomId: filter.roomId?.toString(),
                    startedById: filter.startedById?.toString(),
                    finishedById: filter.finishedById?.toString(),
                },
            },
            take: 3,
            include: {
                roomStatus: true,
                defects: true,
            },
            orderBy: [
                {
                    note: undefined,
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

        expect(prisma.blockade.count).toHaveBeenCalledTimes(1);
        expect(prisma.blockade.count).toHaveBeenCalledWith({
            where: {
                note: {
                    contains: filter.note,
                    mode: 'insensitive',
                },
                roomStatus: {
                    companyId: companyId.toString(),
                    roomId: filter.roomId?.toString(),
                    startedById: filter.startedById?.toString(),
                    finishedById: filter.finishedById?.toString(),
                },
            },
        });
    });

    it('should paginate blockades', async () => {
        const pagination: Pagination<BlockadeSortOptions> = {
            limit: 1,
            sort: {
                createdAt: 'asc',
            },
        };

        jest.spyOn(prisma.blockade, 'findMany').mockResolvedValueOnce(databaseBlockades.slice(0, pagination.limit + 1));
        jest.spyOn(prisma.blockade, 'count').mockResolvedValueOnce(databaseBlockades.length);

        const result = await repository.search(companyId, pagination);

        expect(result).toEqual({
            data: [domainBlockades[0]],
            totalCount: databaseBlockades.length,
            nextCursor: databaseBlockades[1].id,
        });

        expect(prisma.blockade.findMany).toHaveBeenCalledWith({
            where: {
                note: {
                    contains: undefined,
                    mode: 'insensitive',
                },
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
                defects: true,
            },
            orderBy: [
                {
                    note: undefined,
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

        jest.spyOn(prisma.blockade, 'findMany').mockResolvedValueOnce(databaseBlockades.slice(1, pagination.limit + 2));
        jest.spyOn(prisma.blockade, 'count').mockResolvedValueOnce(databaseBlockades.length);

        await expect(
            repository.search(companyId, {
                ...pagination,
                cursor: result.nextCursor!,
            })
        ).resolves.toEqual({
            data: [domainBlockades[1]],
            totalCount: databaseBlockades.length,
            nextCursor: null,
        });

        expect(prisma.blockade.findMany).toHaveBeenCalledWith({
            where: {
                note: {
                    contains: undefined,
                    mode: 'insensitive',
                },
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
                defects: true,
            },
            orderBy: [
                {
                    note: undefined,
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

    it.each([
        [databaseBlockades[0], domainBlockades[0]],
        [databaseBlockades[1], domainBlockades[1]],
    ])('should save a blockade', async (databaseBlockade, domainBlockade) => {
        const {id, roomStatus, defects, ...blockadeModel} = databaseBlockade;
        const defectsModel = defects.map((defect) => ({
            defectId: defect.defectId,
        }));

        jest.spyOn(prisma.roomStatus, 'upsert');

        await repository.save(domainBlockade);

        expect(prisma.roomStatus.upsert).toHaveBeenCalledTimes(1);
        expect(prisma.roomStatus.upsert).toHaveBeenCalledWith({
            where: {
                id,
            },
            create: {
                ...roomStatus,
                blockade: {
                    create: {
                        ...blockadeModel,
                        defects: {
                            createMany: {
                                data: defectsModel,
                            },
                        },
                    },
                },
            },
            update: {
                ...roomStatus,
                blockade: {
                    update: {
                        ...blockadeModel,
                        defects: {
                            deleteMany: {
                                blockadeId: id.toString(),
                                NOT: defectsModel,
                            },
                            createMany: {
                                data: defectsModel,
                                skipDuplicates: true,
                            },
                        },
                    },
                },
            },
        });
    });
});
