import {mockDeep} from 'jest-mock-extended';
import type {Pagination} from '../../../domain/@shared/repository';
import {CompanyId} from '../../../domain/company/entities';
import {InspectionEndReasonType} from '../../../domain/inspection/entities';
import {fakeInspection} from '../../../domain/inspection/entities/__tests__/fake-inspection';
import type {InspectionSearchFilter, InspectionSortOptions} from '../../../domain/inspection/inspection.repository';
import {UserId} from '../../../domain/user/entities';
import type {InspectionModel} from '../inspection.prisma.repository';
import {InspectionPrismaRepository} from '../inspection.prisma.repository';
import type {PrismaService} from '../prisma';

describe('An inspection repository backed by Prisma ORM', () => {
    const prisma = mockDeep<PrismaService>();
    const repository = new InspectionPrismaRepository(prisma);
    const companyId = CompanyId.generate();

    const domainInspections = [
        fakeInspection({
            companyId,
            startedAt: new Date(1000),
        }),
        fakeInspection({
            companyId,
            startedById: UserId.generate(),
            startedAt: new Date(2000),
            finishedById: UserId.generate(),
            finishedAt: new Date(3000),
            endReason: InspectionEndReasonType.APPROVED,
            note: 'a',
            createdAt: new Date(2000),
            updatedAt: new Date(3000),
        }),
    ];

    const databaseInspections: InspectionModel[] = [
        {
            id: domainInspections[0].id.toString(),
            endReason: domainInspections[0].endReason ?? null,
            note: domainInspections[0].note ?? null,
            roomStatus: {
                id: domainInspections[0].id.toString(),
                companyId: domainInspections[0].companyId.toString(),
                roomId: domainInspections[0].roomId.toString(),
                startedById: domainInspections[0].startedById.toString() ?? null,
                startedAt: domainInspections[0].startedAt,
                finishedById: domainInspections[0].finishedById?.toString() ?? null,
                finishedAt: domainInspections[0].finishedAt ?? null,
                createdAt: domainInspections[0].createdAt,
                updatedAt: domainInspections[0].updatedAt,
            },
        },
        {
            id: domainInspections[1].id.toString(),
            endReason: domainInspections[1].endReason ?? null,
            note: domainInspections[1].note ?? null,
            roomStatus: {
                id: domainInspections[1].id.toString(),
                companyId: domainInspections[1].companyId.toString(),
                roomId: domainInspections[1].roomId.toString(),
                startedById: domainInspections[1].startedById.toString() ?? null,
                startedAt: domainInspections[1].startedAt,
                finishedById: domainInspections[1].finishedById?.toString() ?? null,
                finishedAt: domainInspections[1].finishedAt ?? null,
                createdAt: domainInspections[1].createdAt,
                updatedAt: domainInspections[1].updatedAt,
            },
        },
    ];

    it.each([
        [null, null],
        [databaseInspections[0], domainInspections[0]],
    ])('should find an inspection by id', async (databaseInspection, domainInspection) => {
        jest.spyOn(prisma.inspection, 'findUnique').mockResolvedValueOnce(databaseInspection);

        await expect(repository.findById(domainInspections[0].id)).resolves.toEqual(domainInspection);

        expect(prisma.inspection.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.inspection.findUnique).toHaveBeenCalledWith({
            where: {
                id: domainInspections[0].id.toString(),
            },
            include: {
                roomStatus: true,
            },
        });
    });

    it.each([
        [null, null],
        [databaseInspections[0], domainInspections[0]],
    ])('should find an inspection by room', async (databaseInspection, domainInspection) => {
        jest.spyOn(prisma.inspection, 'findFirst').mockResolvedValueOnce(databaseInspection);

        await expect(repository.findByRoom(domainInspections[0].roomId)).resolves.toEqual(domainInspection);

        expect(prisma.inspection.findFirst).toHaveBeenCalledTimes(1);
        expect(prisma.inspection.findFirst).toHaveBeenCalledWith({
            where: {
                roomStatus: {
                    roomId: domainInspections[0].roomId.toString(),
                    finishedById: null,
                },
            },
            include: {
                roomStatus: true,
            },
        });
    });

    it('should search inspections', async () => {
        const pagination: Pagination<InspectionSortOptions> = {
            limit: 3,
            sort: {
                createdAt: 'asc',
            },
        };

        const filter: InspectionSearchFilter = {
            roomId: domainInspections[0].roomId,
            endReason: InspectionEndReasonType.APPROVED,
        };

        jest.spyOn(prisma.inspection, 'findMany').mockResolvedValueOnce(databaseInspections);
        jest.spyOn(prisma.inspection, 'count').mockResolvedValueOnce(databaseInspections.length);

        await expect(repository.search(companyId, pagination, filter)).resolves.toEqual({
            data: domainInspections,
            totalCount: databaseInspections.length,
            nextCursor: null,
        });

        expect(prisma.inspection.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.inspection.findMany).toHaveBeenCalledWith({
            where: {
                endReason: InspectionEndReasonType.APPROVED,
                roomStatus: {
                    companyId: companyId.toString(),
                    roomId: domainInspections[0].roomId.toString(),
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
        expect(prisma.inspection.count).toHaveBeenCalledTimes(1);
        expect(prisma.inspection.count).toHaveBeenCalledWith({
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

    it('should paginate inspections', async () => {
        const pagination: Pagination<InspectionSortOptions> = {
            limit: 1,
            cursor: 'some-cursor',
            sort: {
                createdAt: 'asc',
            },
        };

        jest.spyOn(prisma.inspection, 'findMany').mockResolvedValueOnce(
            databaseInspections.slice(0, pagination.limit + 1)
        );
        jest.spyOn(prisma.inspection, 'count').mockResolvedValueOnce(databaseInspections.length);

        const result = await repository.search(companyId, pagination);

        expect(result).toEqual({
            data: [domainInspections[0]],
            totalCount: databaseInspections.length,
            nextCursor: databaseInspections[1].id,
        });

        expect(prisma.inspection.findMany).toHaveBeenCalledWith({
            where: {
                endReason: undefined,
                roomStatus: {
                    companyId: companyId.toString(),
                    roomId: undefined,
                    startedById: undefined,
                    finishedById: undefined,
                },
            },
            cursor: {
                id: pagination.cursor,
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

    it.each([
        [domainInspections[0], databaseInspections[0]],
        [domainInspections[1], databaseInspections[1]],
    ])('should save inspections', async (domainInspection, databaseInspection) => {
        const {id, roomStatus, ...inspectionModel} = databaseInspection;

        jest.spyOn(prisma.roomStatus, 'upsert');

        await repository.save(domainInspection);

        expect(prisma.roomStatus.upsert).toHaveBeenCalledTimes(1);
        expect(prisma.roomStatus.upsert).toHaveBeenCalledWith({
            where: {
                id,
            },
            create: {
                ...roomStatus,
                inspection: {
                    create: {
                        ...inspectionModel,
                    },
                },
            },
            update: {
                ...roomStatus,
                inspection: {
                    update: inspectionModel,
                },
            },
        });
    });

    it('should rethrow an unknown error when saving an inspection', async () => {
        jest.spyOn(prisma.roomStatus, 'upsert').mockRejectedValue(new Error('Generic error'));
        await expect(repository.save(domainInspections[0])).rejects.toThrowWithMessage(Error, 'Generic error');
    });
});
