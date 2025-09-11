import {mockDeep} from 'jest-mock-extended';
import type {Pagination} from '../../../domain/@shared/repository';
import type {AuditSearchFilter, AuditSortOptions} from '../../../domain/audit/audit.repository';
import {AuditEndReasonType} from '../../../domain/audit/entities';
import {fakeAudit} from '../../../domain/audit/entities/__tests__/fake-audit';
import {CompanyId} from '../../../domain/company/entities';
import type {DefectSortOptions} from '../../../domain/defect/defect.repository';
import {RoomId} from '../../../domain/room/entities';
import {UserId} from '../../../domain/user/entities';
import type {AuditModel} from '../audit.prisma.repository';
import {AuditPrismaRepository} from '../audit.prisma.repository';
import type {PrismaService} from '../prisma';

describe('An audit repository backed by prisma ORM', () => {
    const prisma = mockDeep<PrismaService>();
    const repository = new AuditPrismaRepository(prisma);
    const companyId = CompanyId.generate();
    const roomId1 = RoomId.generate();
    const roomId2 = RoomId.generate();
    const roomId3 = RoomId.generate();

    const domainAudits = [
        fakeAudit({companyId, roomId: roomId1, reason: 'reason 1'}),
        fakeAudit({
            companyId,
            roomId: roomId2,
            startedById: UserId.generate(),
            startedAt: new Date(1000),
            finishedById: UserId.generate(),
            finishedAt: new Date(2000),
            reason: 'reason 2',
            endReason: AuditEndReasonType.COMPLETED,
            note: null,
            createdAt: new Date(1000),
            updatedAt: new Date(2000),
        }),
        fakeAudit({
            companyId,
            roomId: roomId3,
            startedById: UserId.generate(),
            startedAt: new Date(2000),
            finishedById: null,
            finishedAt: null,
            reason: 'reason 3',
            endReason: null,
            note: 'note',
            createdAt: new Date(2000),
            updatedAt: new Date(2000),
        }),
    ];

    const databaseAudits: AuditModel[] = [
        {
            id: domainAudits[0].id.toString(),
            reason: domainAudits[0].reason,
            endReason: domainAudits[0].endReason ? domainAudits[0].endReason : null,
            note: domainAudits[0].note ?? null,
            roomStatus: {
                id: domainAudits[0].id.toString(),
                companyId: domainAudits[0].companyId.toString(),
                roomId: domainAudits[0].roomId.toString(),
                startedById: domainAudits[0].startedById.toString(),
                startedAt: domainAudits[0].startedAt,
                finishedById: domainAudits[0].finishedById ? domainAudits[0].finishedById.toString() : null,
                finishedAt: domainAudits[0].finishedAt ?? null,
                createdAt: domainAudits[0].createdAt,
                updatedAt: domainAudits[0].updatedAt,
            },
        },
        {
            id: domainAudits[1].id.toString(),
            reason: domainAudits[1].reason,
            endReason: domainAudits[1].endReason ? domainAudits[1].endReason : null,
            note: domainAudits[1].note ?? null,
            roomStatus: {
                id: domainAudits[1].id.toString(),
                companyId: domainAudits[1].companyId.toString(),
                roomId: domainAudits[1].roomId.toString(),
                startedById: domainAudits[1].startedById.toString(),
                startedAt: domainAudits[1].startedAt,
                finishedById: domainAudits[1].finishedById ? domainAudits[1].finishedById.toString() : null,
                finishedAt: domainAudits[1].finishedAt ?? null,
                createdAt: domainAudits[1].createdAt,
                updatedAt: domainAudits[1].updatedAt,
            },
        },
        {
            id: domainAudits[2].id.toString(),
            reason: domainAudits[2].reason,
            endReason: domainAudits[2].endReason ? domainAudits[2].endReason : null,
            note: domainAudits[2].note ?? null,
            roomStatus: {
                id: domainAudits[2].id.toString(),
                companyId: domainAudits[2].companyId.toString(),
                roomId: domainAudits[2].roomId.toString(),
                startedById: domainAudits[2].startedById.toString(),
                startedAt: domainAudits[2].startedAt,
                finishedById: domainAudits[2].finishedById ? domainAudits[2].finishedById.toString() : null,
                finishedAt: domainAudits[2].finishedAt ?? null,
                createdAt: domainAudits[2].createdAt,
                updatedAt: domainAudits[2].updatedAt,
            },
        },
    ];

    it.each([
        [null, null],
        [databaseAudits[0], domainAudits[0]],
    ])('should find an audit by id', async (databaseAudit, domainAudit) => {
        prisma.audit.findUnique.mockResolvedValue(databaseAudit);

        await expect(repository.findById(domainAudits[0].id)).resolves.toEqual(domainAudit);

        expect(prisma.audit.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.audit.findUnique).toHaveBeenCalledWith({
            where: {
                id: domainAudits[0].id.toString(),
            },
            include: {
                roomStatus: true,
            },
        });
    });

    it.each([
        [null, null],
        [databaseAudits[0], domainAudits[0]],
    ])('should find an audit by room', async (databaseAudit, domainAudit) => {
        prisma.audit.findFirst.mockResolvedValue(databaseAudit);

        await expect(repository.findByRoom(domainAudits[0].roomId)).resolves.toEqual(domainAudit);

        expect(prisma.audit.findFirst).toHaveBeenCalledTimes(1);
        expect(prisma.audit.findFirst).toHaveBeenCalledWith({
            where: {
                roomStatus: {
                    roomId: domainAudits[0].roomId.toString(),
                    finishedById: null,
                },
            },
            include: {
                roomStatus: true,
            },
        });
    });

    it.each([undefined, AuditEndReasonType.COMPLETED])('should search audits', async (endReason) => {
        const pagination: Pagination<AuditSortOptions> = {
            limit: 3,
            sort: {
                createdAt: 'asc',
            },
        };

        const filter: AuditSearchFilter = {
            endReason,
        };

        jest.spyOn(prisma.audit, 'findMany').mockResolvedValue(databaseAudits);
        jest.spyOn(prisma.audit, 'count').mockResolvedValue(databaseAudits.length);

        await expect(repository.search(companyId, pagination, filter)).resolves.toEqual({
            data: domainAudits,
            totalCount: databaseAudits.length,
            nextCursor: null,
        });

        expect(prisma.audit.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.audit.findMany).toHaveBeenCalledWith({
            where: {
                reason: undefined,
                endReason: filter.endReason,
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
                    reason: undefined,
                },
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

        expect(prisma.audit.count).toHaveBeenCalledTimes(1);
        expect(prisma.audit.count).toHaveBeenCalledWith({
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

    it('should paginate audits', async () => {
        const pagination: Pagination<DefectSortOptions> = {
            limit: 1,
            sort: {
                createdAt: 'asc',
            },
        };

        jest.spyOn(prisma.audit, 'findMany').mockResolvedValueOnce(databaseAudits.slice(0, pagination.limit + 1));
        jest.spyOn(prisma.audit, 'count').mockResolvedValueOnce(databaseAudits.length);

        const result = await repository.search(companyId, pagination);

        expect(result).toEqual({
            data: [domainAudits[0]],
            totalCount: databaseAudits.length,
            nextCursor: databaseAudits[1].id,
        });

        expect(prisma.audit.findMany).toHaveBeenCalledWith({
            where: {
                reason: undefined,
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
                    reason: undefined,
                },
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

        jest.spyOn(prisma.audit, 'findMany').mockResolvedValueOnce(databaseAudits.slice(1, pagination.limit + 2));
        jest.spyOn(prisma.audit, 'count').mockResolvedValueOnce(databaseAudits.length);

        await expect(
            repository.search(companyId, {
                ...pagination,
                cursor: result.nextCursor!,
            })
        ).resolves.toEqual({
            data: [domainAudits[1]],
            totalCount: databaseAudits.length,
            nextCursor: databaseAudits[2].id,
        });

        expect(prisma.audit.findMany).toHaveBeenCalledWith({
            where: {
                reason: undefined,
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
                    reason: undefined,
                },
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

        jest.spyOn(prisma.audit, 'findMany').mockResolvedValueOnce(databaseAudits.slice(2, pagination.limit + 3));
        jest.spyOn(prisma.audit, 'count').mockResolvedValueOnce(databaseAudits.length);

        await expect(
            repository.search(companyId, {
                ...pagination,
                cursor: result.nextCursor!,
            })
        ).resolves.toEqual({
            data: [domainAudits[2]],
            totalCount: databaseAudits.length,
            nextCursor: null,
        });

        expect(prisma.audit.findMany).toHaveBeenCalledWith({
            where: {
                reason: undefined,
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
                    reason: undefined,
                },
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
        [databaseAudits[0], domainAudits[0]],
        [databaseAudits[1], domainAudits[1]],
        [databaseAudits[2], domainAudits[2]],
    ])('should save audits', async (databaseAudit, domainAudit) => {
        const {id, roomStatus, ...cleaningModel} = databaseAudit;

        jest.spyOn(prisma.roomStatus, 'upsert');

        await repository.save(domainAudit);

        expect(prisma.roomStatus.upsert).toHaveBeenCalledTimes(1);
        expect(prisma.roomStatus.upsert).toHaveBeenCalledWith({
            where: {
                id,
            },
            create: {
                ...roomStatus,
                audit: {
                    create: {
                        ...cleaningModel,
                    },
                },
            },
            update: {
                ...roomStatus,
                audit: {
                    update: cleaningModel,
                },
            },
        });
    });
});
