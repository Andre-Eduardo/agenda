import {Injectable} from '@nestjs/common';
import PrismaClient, {Prisma} from '@prisma/client';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import type {
    CleaningRepository,
    CleaningSearchFilter,
    CleaningSortOptions,
} from '../../domain/cleaning/cleaning.repository';
import {Cleaning, CleaningEndReasonType} from '../../domain/cleaning/entities';
import {CompanyId} from '../../domain/company/entities';
import {RoomId} from '../../domain/room/entities';
import {RoomStatusId} from '../../domain/room-status/entities';
import {UserId} from '../../domain/user/entities';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';

const cleaningWithRoomStatus = Prisma.validator<Prisma.CleaningDefaultArgs>()({
    include: {
        roomStatus: true,
    },
});

export type CleaningModel = Prisma.CleaningGetPayload<typeof cleaningWithRoomStatus>;

@Injectable()
export class CleaningPrismaRepository extends PrismaRepository implements CleaningRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    private static normalize(cleaning: CleaningModel): Cleaning {
        return new Cleaning({
            ...cleaning,
            id: RoomStatusId.from(cleaning.id),
            companyId: CompanyId.from(cleaning.roomStatus.companyId),
            roomId: RoomId.from(cleaning.roomStatus.roomId),
            endReason: cleaning.endReason === null ? null : CleaningEndReasonType[cleaning.endReason],
            finishedById: cleaning.roomStatus.finishedById ? UserId.from(cleaning.roomStatus.finishedById) : null,
            finishedAt: cleaning.roomStatus.finishedAt ?? null,
            startedById: UserId.from(cleaning.roomStatus.startedById),
            startedAt: cleaning.roomStatus.startedAt,
            createdAt: cleaning.roomStatus.createdAt,
            updatedAt: cleaning.roomStatus.updatedAt,
        });
    }

    private static denormalize(cleaning: Cleaning): CleaningModel {
        return {
            id: cleaning.id.toString(),
            endReason: cleaning.endReason ?? null,
            roomStatus: {
                id: cleaning.id.toString(),
                companyId: cleaning.companyId.toString(),
                roomId: cleaning.roomId.toString(),
                startedById: cleaning.startedById.toString(),
                startedAt: cleaning.startedAt,
                finishedById: cleaning.finishedById?.toString() ?? null,
                finishedAt: cleaning.finishedAt ?? null,
                createdAt: cleaning.createdAt,
                updatedAt: cleaning.updatedAt,
            },
        };
    }

    async findById(id: RoomStatusId): Promise<Cleaning | null> {
        const cleaning = await this.prisma.cleaning.findUnique({
            where: {
                id: id.toString(),
            },
            ...cleaningWithRoomStatus,
        });

        return cleaning === null ? null : CleaningPrismaRepository.normalize(cleaning);
    }

    async findByRoom(roomId: RoomId): Promise<Cleaning | null> {
        const cleaning = await this.prisma.cleaning.findFirst({
            where: {
                roomStatus: {
                    roomId: roomId.toString(),
                    finishedById: null,
                },
            },
            ...cleaningWithRoomStatus,
        });

        return cleaning === null ? null : CleaningPrismaRepository.normalize(cleaning);
    }

    async search(
        companyId: CompanyId,
        pagination: Pagination<CleaningSortOptions>,
        filter: CleaningSearchFilter = {}
    ): Promise<PaginatedList<Cleaning>> {
        const where: PrismaClient.Prisma.CleaningWhereInput = {
            endReason: filter.endReason,
            roomStatus: {
                companyId: companyId.toString(),
                roomId: filter?.roomId?.toString(),
                startedById: filter?.startedById?.toString(),
                finishedById: filter?.finishedById?.toString(),
            },
        };

        const {endReason, ...roomStatusSort} = pagination.sort;

        const [cleanings, totalCount] = await Promise.all([
            this.prisma.cleaning.findMany({
                where,
                ...(pagination.cursor && {
                    cursor: {
                        id: pagination.cursor,
                    },
                }),
                ...cleaningWithRoomStatus,
                take: pagination.limit + 1,
                orderBy: [
                    ...this.normalizeSort({endReason}),
                    ...this.normalizeSort(roomStatusSort).map((sort) => ({roomStatus: sort})),
                    {id: 'asc'},
                ],
            }),
            this.prisma.cleaning.count({where}),
        ]);

        return {
            data: cleanings.slice(0, pagination.limit).map((cleaning) => CleaningPrismaRepository.normalize(cleaning)),
            totalCount,
            nextCursor: cleanings.length > pagination.limit ? cleanings[cleanings.length - 1].id : null,
        };
    }

    async save(cleaning: Cleaning): Promise<void> {
        const {id, roomStatus, ...cleaningModel} = CleaningPrismaRepository.denormalize(cleaning);

        await this.prisma.roomStatus.upsert({
            where: {
                id,
            },
            create: {
                ...roomStatus,
                cleaning: {
                    create: cleaningModel,
                },
            },
            update: {
                ...roomStatus,
                cleaning: {
                    update: cleaningModel,
                },
            },
        });
    }
}
