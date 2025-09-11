import {Injectable} from '@nestjs/common';
import PrismaClient, {Prisma} from '@prisma/client';
import type {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {CompanyId} from '../../domain/company/entities';
import {InspectionEndReasonType, Inspection} from '../../domain/inspection/entities';
import {
    InspectionRepository,
    InspectionSearchFilter,
    InspectionSortOptions,
} from '../../domain/inspection/inspection.repository';
import {RoomId} from '../../domain/room/entities';
import {RoomStatusId} from '../../domain/room-status/entities';
import {UserId} from '../../domain/user/entities';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';

const inspectionWithRoomStatus = Prisma.validator<Prisma.InspectionDefaultArgs>()({
    include: {
        roomStatus: true,
    },
});

export type InspectionModel = Prisma.InspectionGetPayload<typeof inspectionWithRoomStatus>;

@Injectable()
export class InspectionPrismaRepository extends PrismaRepository implements InspectionRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    private static normalize(inspection: InspectionModel): Inspection {
        return new Inspection({
            ...inspection,
            id: RoomStatusId.from(inspection.id),
            companyId: CompanyId.from(inspection.roomStatus.companyId),
            roomId: RoomId.from(inspection.roomStatus.roomId),
            startedById: UserId.from(inspection.roomStatus.startedById),
            startedAt: inspection.roomStatus.startedAt,
            finishedById: inspection.roomStatus.finishedById ? UserId.from(inspection.roomStatus.finishedById) : null,
            finishedAt: inspection.roomStatus.finishedAt ?? null,
            note: inspection.note ?? null,
            endReason: inspection.endReason !== null ? InspectionEndReasonType[inspection.endReason] : null,
            createdAt: inspection.roomStatus.createdAt,
            updatedAt: inspection.roomStatus.updatedAt,
        });
    }

    private static denormalize(inspection: Inspection): InspectionModel {
        return {
            id: inspection.id.toString(),
            note: inspection.note,
            endReason: inspection.endReason ? InspectionEndReasonType[inspection.endReason] : null,
            roomStatus: {
                id: inspection.id.toString(),
                companyId: inspection.companyId.toString(),
                roomId: inspection.roomId.toString(),
                startedById: inspection.startedById.toString(),
                startedAt: inspection.startedAt,
                finishedById: inspection.finishedById?.toString() ?? null,
                finishedAt: inspection.finishedAt ?? null,
                createdAt: inspection.createdAt,
                updatedAt: inspection.updatedAt,
            },
        };
    }

    async findById(id: RoomStatusId): Promise<Inspection | null> {
        const inspection = await this.prisma.inspection.findUnique({
            where: {
                id: id.toString(),
            },
            ...inspectionWithRoomStatus,
        });

        return inspection === null ? null : InspectionPrismaRepository.normalize(inspection);
    }

    async findByRoom(roomId: RoomId): Promise<Inspection | null> {
        const inspection = await this.prisma.inspection.findFirst({
            where: {
                roomStatus: {
                    roomId: roomId.toString(),
                    finishedById: null,
                },
            },
            ...inspectionWithRoomStatus,
        });

        return inspection === null ? null : InspectionPrismaRepository.normalize(inspection);
    }

    async search(
        companyId: CompanyId,
        pagination: Pagination<InspectionSortOptions>,
        filter: InspectionSearchFilter = {}
    ): Promise<PaginatedList<Inspection>> {
        const where: PrismaClient.Prisma.InspectionWhereInput = {
            endReason: filter.endReason,
            roomStatus: {
                companyId: companyId.toString(),
                roomId: filter.roomId?.toString(),
                startedById: filter.startedById?.toString(),
                finishedById: filter.finishedById?.toString(),
            },
        };

        const {endReason, ...roomStatusSort} = pagination.sort;

        const [inspections, totalCount] = await Promise.all([
            this.prisma.inspection.findMany({
                where,
                ...(pagination.cursor && {
                    cursor: {
                        id: pagination.cursor,
                    },
                }),
                ...inspectionWithRoomStatus,
                take: pagination.limit + 1,
                orderBy: [
                    ...this.normalizeSort({endReason}),
                    ...this.normalizeSort(roomStatusSort).map((sort) => ({roomStatus: sort})),
                    {id: 'asc'},
                ],
            }),
            this.prisma.inspection.count({where}),
        ]);

        return {
            data: inspections
                .slice(0, pagination.limit)
                .map((inspection) => InspectionPrismaRepository.normalize(inspection)),
            totalCount,
            nextCursor: inspections.length > pagination.limit ? inspections[inspections.length - 1].id : null,
        };
    }

    async save(inspection: Inspection): Promise<void> {
        const {id, roomStatus, ...inspectionModel} = InspectionPrismaRepository.denormalize(inspection);

        await this.prisma.roomStatus.upsert({
            where: {
                id,
            },
            create: {
                ...roomStatus,
                inspection: {
                    create: inspectionModel,
                },
            },
            update: {
                ...roomStatus,
                inspection: {
                    update: inspectionModel,
                },
            },
        });
    }
}
