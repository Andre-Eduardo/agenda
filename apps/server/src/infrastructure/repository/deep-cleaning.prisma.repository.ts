import {Injectable} from '@nestjs/common';
import PrismaClient, {Prisma} from '@prisma/client';
import type {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {CompanyId} from '../../domain/company/entities';
import type {
    DeepCleaningRepository,
    DeepCleaningSearchFilter,
    DeepCleaningSortOptions,
} from '../../domain/deep-cleaning/deep-cleaning.repository';
import {DeepCleaning, DeepCleaningEndReasonType} from '../../domain/deep-cleaning/entities';
import {RoomId} from '../../domain/room/entities';
import {RoomStatusId} from '../../domain/room-status/entities';
import {UserId} from '../../domain/user/entities';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';

const deepCleaningWithRoomStatus = Prisma.validator<Prisma.DeepCleaningDefaultArgs>()({
    include: {
        roomStatus: true,
    },
});

export type DeepCleaningModel = Prisma.DeepCleaningGetPayload<typeof deepCleaningWithRoomStatus>;

@Injectable()
export class DeepCleaningPrismaRepository extends PrismaRepository implements DeepCleaningRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    private static normalize(deepCleaning: DeepCleaningModel): DeepCleaning {
        return new DeepCleaning({
            ...deepCleaning,
            id: RoomStatusId.from(deepCleaning.id),
            companyId: CompanyId.from(deepCleaning.roomStatus.companyId),
            roomId: RoomId.from(deepCleaning.roomStatus.roomId),
            endReason: deepCleaning.endReason === null ? null : DeepCleaningEndReasonType[deepCleaning.endReason],
            finishedById: deepCleaning.roomStatus.finishedById
                ? UserId.from(deepCleaning.roomStatus.finishedById)
                : null,
            finishedAt: deepCleaning.roomStatus.finishedAt ?? null,
            startedById: UserId.from(deepCleaning.roomStatus.startedById),
            startedAt: deepCleaning.roomStatus.startedAt,
            createdAt: deepCleaning.roomStatus.createdAt,
            updatedAt: deepCleaning.roomStatus.updatedAt,
        });
    }

    private static denormalize(deepCleaning: DeepCleaning): DeepCleaningModel {
        return {
            id: deepCleaning.id.toString(),
            endReason: deepCleaning.endReason ?? null,
            roomStatus: {
                id: deepCleaning.id.toString(),
                companyId: deepCleaning.companyId.toString(),
                roomId: deepCleaning.roomId.toString(),
                startedById: deepCleaning.startedById.toString(),
                startedAt: deepCleaning.startedAt,
                finishedById: deepCleaning.finishedById?.toString() ?? null,
                finishedAt: deepCleaning.finishedAt ?? null,
                createdAt: deepCleaning.createdAt,
                updatedAt: deepCleaning.updatedAt,
            },
        };
    }

    async findById(id: RoomStatusId): Promise<DeepCleaning | null> {
        const deepCleaning = await this.prisma.deepCleaning.findUnique({
            where: {
                id: id.toString(),
            },
            ...deepCleaningWithRoomStatus,
        });

        return deepCleaning === null ? null : DeepCleaningPrismaRepository.normalize(deepCleaning);
    }

    async findByRoom(roomId: RoomId): Promise<DeepCleaning | null> {
        const deepCleaning = await this.prisma.deepCleaning.findFirst({
            where: {
                roomStatus: {
                    roomId: roomId.toString(),
                    finishedById: null,
                },
            },
            ...deepCleaningWithRoomStatus,
        });

        return deepCleaning === null ? null : DeepCleaningPrismaRepository.normalize(deepCleaning);
    }

    async search(
        companyId: CompanyId,
        pagination: Pagination<DeepCleaningSortOptions>,
        filter: DeepCleaningSearchFilter = {}
    ): Promise<PaginatedList<DeepCleaning>> {
        const where: PrismaClient.Prisma.DeepCleaningWhereInput = {
            endReason: filter.endReason,
            roomStatus: {
                companyId: companyId.toString(),
                roomId: filter?.roomId?.toString(),
                startedById: filter?.startedById?.toString(),
                finishedById: filter?.finishedById?.toString(),
            },
        };

        const {endReason, ...roomStatusSort} = pagination.sort;

        const [deepCleanings, totalCount] = await Promise.all([
            this.prisma.deepCleaning.findMany({
                where,
                ...(pagination.cursor && {
                    cursor: {
                        id: pagination.cursor,
                    },
                }),
                ...deepCleaningWithRoomStatus,
                take: pagination.limit + 1,
                orderBy: [
                    ...this.normalizeSort({endReason}),
                    ...this.normalizeSort(roomStatusSort).map((sort) => ({roomStatus: sort})),
                    {id: 'asc'},
                ],
            }),
            this.prisma.deepCleaning.count({where}),
        ]);

        return {
            data: deepCleanings
                .slice(0, pagination.limit)
                .map((cleaning) => DeepCleaningPrismaRepository.normalize(cleaning)),
            totalCount,
            nextCursor: deepCleanings.length > pagination.limit ? deepCleanings[deepCleanings.length - 1].id : null,
        };
    }

    async save(deepCleaning: DeepCleaning): Promise<void> {
        const {id, roomStatus, ...deepCleaningModel} = DeepCleaningPrismaRepository.denormalize(deepCleaning);

        await this.prisma.roomStatus.upsert({
            where: {
                id,
            },
            create: {
                ...roomStatus,
                deepCleaning: {
                    create: deepCleaningModel,
                },
            },
            update: {
                ...roomStatus,
                deepCleaning: {
                    update: deepCleaningModel,
                },
            },
        });
    }
}
