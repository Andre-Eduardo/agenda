import {Injectable} from '@nestjs/common';
import PrismaClient, {Prisma} from '@prisma/client';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {AuditRepository, AuditSearchFilter, AuditSortOptions} from '../../domain/audit/audit.repository';
import {Audit, AuditEndReasonType} from '../../domain/audit/entities';
import {CompanyId} from '../../domain/company/entities';
import {RoomId} from '../../domain/room/entities';
import {RoomStatusId} from '../../domain/room-status/entities';
import {UserId} from '../../domain/user/entities';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';

const auditWithRoomStatus = Prisma.validator<Prisma.AuditDefaultArgs>()({
    include: {
        roomStatus: true,
    },
});

export type AuditModel = Prisma.AuditGetPayload<typeof auditWithRoomStatus>;

@Injectable()
export class AuditPrismaRepository extends PrismaRepository implements AuditRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    private static normalize(audit: AuditModel): Audit {
        return new Audit({
            ...audit,
            id: RoomStatusId.from(audit.id),
            companyId: CompanyId.from(audit.roomStatus.companyId),
            roomId: RoomId.from(audit.roomStatus.roomId),
            startedById: UserId.from(audit.roomStatus.startedById),
            startedAt: audit.roomStatus.startedAt,
            finishedById: audit.roomStatus.finishedById ? UserId.from(audit.roomStatus.finishedById) : null,
            finishedAt: audit.roomStatus.finishedAt ?? null,
            reason: audit.reason,
            endReason: audit.endReason ? AuditEndReasonType[audit.endReason] : null,
            note: audit.note ?? null,
            createdAt: audit.roomStatus.createdAt,
            updatedAt: audit.roomStatus.updatedAt,
        });
    }

    private static denormalize(audit: Audit): AuditModel {
        return {
            id: audit.id.toString(),
            reason: audit.reason,
            endReason: audit.endReason ? AuditEndReasonType[audit.endReason] : null,
            note: audit.note ?? null,
            roomStatus: {
                id: audit.id.toString(),
                companyId: audit.companyId.toString(),
                roomId: audit.roomId.toString(),
                startedById: audit.startedById.toString(),
                startedAt: audit.startedAt,
                finishedById: audit.finishedById?.toString() ?? null,
                finishedAt: audit.finishedAt ?? null,
                createdAt: audit.createdAt,
                updatedAt: audit.updatedAt,
            },
        };
    }

    async findById(id: RoomStatusId): Promise<Audit | null> {
        const audit = await this.prisma.audit.findUnique({
            where: {
                id: id.toString(),
            },
            ...auditWithRoomStatus,
        });

        return audit === null ? null : AuditPrismaRepository.normalize(audit);
    }

    async findByRoom(roomId: RoomId): Promise<Audit | null> {
        const audit = await this.prisma.audit.findFirst({
            where: {
                roomStatus: {
                    roomId: roomId.toString(),
                    finishedById: null,
                },
            },
            ...auditWithRoomStatus,
        });

        return audit === null ? null : AuditPrismaRepository.normalize(audit);
    }

    async search(
        companyId: CompanyId,
        pagination: Pagination<AuditSortOptions>,
        filter?: AuditSearchFilter
    ): Promise<PaginatedList<Audit>> {
        const where: PrismaClient.Prisma.AuditWhereInput = {
            reason: filter?.reason,
            endReason: filter?.endReason,
            roomStatus: {
                companyId: companyId.toString(),
                roomId: filter?.roomId?.toString(),
                startedById: filter?.startedById?.toString(),
                finishedById: filter?.finishedById?.toString(),
            },
        };

        const {reason, endReason, ...roomStatusSort} = pagination.sort;

        const [audits, totalCount] = await Promise.all([
            this.prisma.audit.findMany({
                where,
                ...(pagination.cursor && {
                    cursor: {
                        id: pagination.cursor,
                    },
                }),
                ...auditWithRoomStatus,
                take: pagination.limit + 1,
                orderBy: [
                    ...this.normalizeSort({reason, endReason}),
                    ...this.normalizeSort(roomStatusSort).map((sort) => ({roomStatus: sort})),
                    {id: 'asc'},
                ],
            }),
            this.prisma.audit.count({where}),
        ]);

        return {
            data: audits.slice(0, pagination.limit).map((audit) => AuditPrismaRepository.normalize(audit)),
            totalCount,
            nextCursor: audits.length > pagination.limit ? audits[audits.length - 1].id : null,
        };
    }

    async save(audit: Audit): Promise<void> {
        const {id, roomStatus, ...auditModel} = AuditPrismaRepository.denormalize(audit);

        await this.prisma.roomStatus.upsert({
            where: {
                id,
            },
            create: {
                ...roomStatus,
                audit: {
                    create: auditModel,
                },
            },
            update: {
                ...roomStatus,
                audit: {
                    update: auditModel,
                },
            },
        });
    }
}
