import {Injectable} from '@nestjs/common';
import PrismaClient, {Prisma} from '@prisma/client';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {CompanyId} from '../../domain/company/entities';
import {DefectId} from '../../domain/defect/entities';
import {Maintenance} from '../../domain/maintenance/entities';
import type {
    MaintenanceRepository,
    MaintenanceSearchFilter,
    MaintenanceSortOptions,
} from '../../domain/maintenance/maintenance.repository';
import {RoomId} from '../../domain/room/entities';
import {RoomStatusId} from '../../domain/room-status/entities';
import {UserId} from '../../domain/user/entities';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';

const maintenanceWithRoomStatus = Prisma.validator<Prisma.MaintenanceDefaultArgs>()({
    include: {
        roomStatus: true,
        defects: true,
    },
});

export type MaintenanceModel = Prisma.MaintenanceGetPayload<typeof maintenanceWithRoomStatus>;

@Injectable()
export class MaintenancePrismaRepository extends PrismaRepository implements MaintenanceRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    private static normalize(maintenance: MaintenanceModel): Maintenance {
        return new Maintenance({
            ...maintenance,
            id: RoomStatusId.from(maintenance.id),
            companyId: CompanyId.from(maintenance.roomStatus.companyId),
            note: maintenance.note,
            roomId: RoomId.from(maintenance.roomStatus.roomId),
            defects: maintenance.defects.map((defect) => DefectId.from(defect.defectId)),
            finishedById: maintenance.roomStatus.finishedById ? UserId.from(maintenance.roomStatus.finishedById) : null,
            finishedAt: maintenance.roomStatus.finishedAt ?? null,
            startedById: UserId.from(maintenance.roomStatus.startedById),
            startedAt: maintenance.roomStatus.startedAt,
            createdAt: maintenance.roomStatus.createdAt,
            updatedAt: maintenance.roomStatus.updatedAt,
        });
    }

    private static denormalize(maintenance: Maintenance): MaintenanceModel {
        return {
            id: maintenance.id.toString(),
            note: maintenance.note,
            defects: maintenance.defects.map((defectId) => ({
                defectId: defectId.toString(),
                maintenanceId: maintenance.id.toString(),
            })),
            roomStatus: {
                id: maintenance.id.toString(),
                companyId: maintenance.companyId.toString(),
                roomId: maintenance.roomId.toString(),
                startedById: maintenance.startedById.toString(),
                startedAt: maintenance.startedAt,
                finishedById: maintenance.finishedById?.toString() ?? null,
                finishedAt: maintenance.finishedAt ?? null,
                createdAt: maintenance.createdAt,
                updatedAt: maintenance.updatedAt,
            },
        };
    }

    async findById(id: RoomStatusId): Promise<Maintenance | null> {
        const maintenance = await this.prisma.maintenance.findUnique({
            where: {
                id: id.toString(),
            },
            ...maintenanceWithRoomStatus,
        });

        return maintenance === null ? null : MaintenancePrismaRepository.normalize(maintenance);
    }

    async findByRoom(roomId: RoomId): Promise<Maintenance | null> {
        const maintenance = await this.prisma.maintenance.findFirst({
            where: {
                roomStatus: {
                    roomId: roomId.toString(),
                    finishedById: null,
                },
            },
            ...maintenanceWithRoomStatus,
        });

        return maintenance === null ? null : MaintenancePrismaRepository.normalize(maintenance);
    }

    async search(
        companyId: CompanyId,
        pagination: Pagination<MaintenanceSortOptions>,
        filter: MaintenanceSearchFilter = {}
    ): Promise<PaginatedList<Maintenance>> {
        const where: PrismaClient.Prisma.MaintenanceWhereInput = {
            note: {
                contains: filter.note,
                mode: 'insensitive',
            },
            roomStatus: {
                companyId: companyId.toString(),
                roomId: filter?.roomId?.toString(),
                startedById: filter?.startedById?.toString(),
                finishedById: filter?.finishedById?.toString(),
            },
        };

        const {note, ...roomStatusSort} = pagination.sort;

        const [maintenances, totalCount] = await Promise.all([
            this.prisma.maintenance.findMany({
                where,
                ...(pagination.cursor && {
                    cursor: {
                        id: pagination.cursor,
                    },
                }),
                ...maintenanceWithRoomStatus,
                take: pagination.limit + 1,
                orderBy: [
                    ...this.normalizeSort({note}),
                    ...this.normalizeSort(roomStatusSort).map((sort) => ({roomStatus: sort})),
                    {id: 'asc'},
                ],
            }),
            this.prisma.maintenance.count({where}),
        ]);

        return {
            data: maintenances
                .slice(0, pagination.limit)
                .map((maintenance) => MaintenancePrismaRepository.normalize(maintenance)),
            totalCount,
            nextCursor: maintenances.length > pagination.limit ? maintenances[maintenances.length - 1].id : null,
        };
    }

    async save(maintenance: Maintenance): Promise<void> {
        const {id, roomStatus, defects, ...maintenanceModel} = MaintenancePrismaRepository.denormalize(maintenance);
        const defectsModel = defects.map((defect) => ({
            defectId: defect.defectId,
        }));

        await this.prisma.roomStatus.upsert({
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
    }
}
