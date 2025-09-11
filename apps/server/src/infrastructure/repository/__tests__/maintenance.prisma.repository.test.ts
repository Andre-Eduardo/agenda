import {mockDeep} from 'jest-mock-extended';
import type {Pagination} from '../../../domain/@shared/repository';
import {CompanyId} from '../../../domain/company/entities';
import {fakeMaintenance} from '../../../domain/maintenance/entities/__tests__/fake-maintenance';
import type {MaintenanceSearchFilter, MaintenanceSortOptions} from '../../../domain/maintenance/maintenance.repository';
import {RoomId} from '../../../domain/room/entities';
import {UserId} from '../../../domain/user/entities';
import type {MaintenanceModel} from '../maintenance.prisma.repository';
import {MaintenancePrismaRepository} from '../maintenance.prisma.repository';
import type {PrismaService} from '../prisma';

describe('A maintenance repository backed by Prisma ORM', () => {
    const prisma = mockDeep<PrismaService>();
    const repository = new MaintenancePrismaRepository(prisma);
    const companyId = CompanyId.generate();
    const roomId = RoomId.generate();
    const now = new Date();

    const domainMaintenances = [
        fakeMaintenance({
            companyId,
            roomId,
        }),
        fakeMaintenance({
            companyId,
            finishedById: UserId.generate(),
            finishedAt: now,
        }),
    ];

    const databaseMaintenances: MaintenanceModel[] = [
        {
            id: domainMaintenances[0].id.toString(),
            note: domainMaintenances[0].note,
            defects: domainMaintenances[0].defects.map((defectId) => ({
                defectId: defectId.toString(),
                maintenanceId: domainMaintenances[0].id.toString(),
            })),
            roomStatus: {
                id: domainMaintenances[0].id.toString(),
                companyId: domainMaintenances[0].companyId.toString(),
                roomId: domainMaintenances[0].roomId.toString(),
                startedById: domainMaintenances[0].startedById.toString(),
                startedAt: domainMaintenances[0].startedAt,
                finishedById:
                    domainMaintenances[0].finishedById === null ? null : domainMaintenances[0].finishedById.toString(),
                finishedAt: domainMaintenances[0].finishedAt ?? null,
                createdAt: domainMaintenances[0].createdAt,
                updatedAt: domainMaintenances[0].updatedAt,
            },
        },
        {
            id: domainMaintenances[1].id.toString(),
            note: domainMaintenances[1].note,
            defects: domainMaintenances[1].defects.map((defectId) => ({
                defectId: defectId.toString(),
                maintenanceId: domainMaintenances[1].id.toString(),
            })),
            roomStatus: {
                id: domainMaintenances[1].id.toString(),
                companyId: domainMaintenances[1].companyId.toString(),
                roomId: domainMaintenances[1].roomId.toString(),
                startedById: domainMaintenances[1].startedById.toString(),
                startedAt: domainMaintenances[1].startedAt,
                finishedById:
                    domainMaintenances[1].finishedById === null ? null : domainMaintenances[1].finishedById.toString(),
                finishedAt: domainMaintenances[1].finishedAt ?? null,
                createdAt: domainMaintenances[1].createdAt,
                updatedAt: domainMaintenances[1].updatedAt,
            },
        },
    ];

    it.each([
        [null, null],
        [databaseMaintenances[0], domainMaintenances[0]],
    ])('should find a maintenance by ID', async (databaseMaintenance, domainMaintenance) => {
        jest.spyOn(prisma.maintenance, 'findUnique').mockResolvedValueOnce(databaseMaintenance);

        const result = await repository.findById(domainMaintenances[0].id);

        expect(result).toEqual(domainMaintenance);
        expect(prisma.maintenance.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.maintenance.findUnique).toHaveBeenCalledWith({
            where: {
                id: domainMaintenances[0].id.toString(),
            },
            include: {
                roomStatus: true,
                defects: true,
            },
        });
    });

    it.each([
        [null, null],
        [databaseMaintenances[0], domainMaintenances[0]],
    ])('should find a maintenance by room', async (databaseMaintenance, domainMaintenance) => {
        jest.spyOn(prisma.maintenance, 'findFirst').mockResolvedValueOnce(databaseMaintenance);

        const result = await repository.findByRoom(domainMaintenances[0].roomId);

        expect(result).toEqual(domainMaintenance);
        expect(prisma.maintenance.findFirst).toHaveBeenCalledTimes(1);
        expect(prisma.maintenance.findFirst).toHaveBeenCalledWith({
            where: {
                roomStatus: {
                    roomId: domainMaintenances[0].roomId.toString(),
                    finishedById: null,
                },
            },
            include: {
                roomStatus: true,
                defects: true,
            },
        });
    });

    it('should search maintenances', async () => {
        const pagination: Pagination<MaintenanceSortOptions> = {
            limit: 2,
            sort: {
                createdAt: 'asc',
            },
        };

        const filter: MaintenanceSearchFilter = {
            roomId,
        };

        jest.spyOn(prisma.maintenance, 'findMany').mockResolvedValueOnce(databaseMaintenances);
        jest.spyOn(prisma.maintenance, 'count').mockResolvedValueOnce(databaseMaintenances.length);

        await expect(repository.search(companyId, pagination, filter)).resolves.toEqual({
            data: domainMaintenances,
            totalCount: databaseMaintenances.length,
            nextCursor: null,
        });

        expect(prisma.maintenance.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.maintenance.findMany).toHaveBeenCalledWith({
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

        expect(prisma.maintenance.count).toHaveBeenCalledTimes(1);
        expect(prisma.maintenance.count).toHaveBeenCalledWith({
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

    it('should paginate maintenances', async () => {
        const pagination: Pagination<MaintenanceSortOptions> = {
            limit: 1,
            sort: {
                createdAt: 'asc',
            },
        };

        jest.spyOn(prisma.maintenance, 'findMany').mockResolvedValueOnce(
            databaseMaintenances.slice(0, pagination.limit + 1)
        );
        jest.spyOn(prisma.maintenance, 'count').mockResolvedValueOnce(databaseMaintenances.length);

        const result = await repository.search(companyId, pagination);

        expect(result).toEqual({
            data: [domainMaintenances[0]],
            totalCount: databaseMaintenances.length,
            nextCursor: databaseMaintenances[1].id,
        });

        expect(prisma.maintenance.findMany).toHaveBeenCalledWith({
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

        jest.spyOn(prisma.maintenance, 'findMany').mockResolvedValueOnce(
            databaseMaintenances.slice(1, pagination.limit + 2)
        );
        jest.spyOn(prisma.maintenance, 'count').mockResolvedValueOnce(databaseMaintenances.length);

        await expect(
            repository.search(companyId, {
                ...pagination,
                cursor: result.nextCursor!,
            })
        ).resolves.toEqual({
            data: [domainMaintenances[1]],
            totalCount: databaseMaintenances.length,
            nextCursor: null,
        });

        expect(prisma.maintenance.findMany).toHaveBeenCalledWith({
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
        [databaseMaintenances[0], domainMaintenances[0]],
        [databaseMaintenances[1], domainMaintenances[1]],
    ])('should save a maintenance', async (databaseMaintenance, domainMaintenance) => {
        const {id, roomStatus, defects, ...maintenanceModel} = databaseMaintenance;
        const defectsModel = defects.map((defect) => ({
            defectId: defect.defectId,
        }));

        jest.spyOn(prisma.roomStatus, 'upsert');

        await repository.save(domainMaintenance);

        expect(prisma.roomStatus.upsert).toHaveBeenCalledTimes(1);
        expect(prisma.roomStatus.upsert).toHaveBeenCalledWith({
            where: {
                id,
            },
            create: {
                ...roomStatus,
                maintenance: {
                    create: {
                        ...maintenanceModel,
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
                maintenance: {
                    update: {
                        ...maintenanceModel,
                        defects: {
                            deleteMany: {
                                maintenanceId: id.toString(),
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
