import {Injectable} from '@nestjs/common';
import PrismaClient, {Prisma} from '@prisma/client';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {BlockadeRepository, BlockadeSearchFilter, BlockadeSortOptions} from '../../domain/blockade/blockade.repository';
import {Blockade} from '../../domain/blockade/entities';
import {CompanyId} from '../../domain/company/entities';
import {DefectId} from '../../domain/defect/entities';
import {RoomId} from '../../domain/room/entities';
import {RoomStatusId} from '../../domain/room-status/entities';
import {UserId} from '../../domain/user/entities';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';

const blockadeWithRoomStatus = Prisma.validator<Prisma.BlockadeDefaultArgs>()({
    include: {
        roomStatus: true,
        defects: true,
    },
});

export type BlockadeModel = Prisma.BlockadeGetPayload<typeof blockadeWithRoomStatus>;

@Injectable()
export class BlockadePrismaRepository extends PrismaRepository implements BlockadeRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    private static normalize(blockade: BlockadeModel): Blockade {
        return new Blockade({
            ...blockade,
            id: RoomStatusId.from(blockade.id),
            companyId: CompanyId.from(blockade.roomStatus.companyId),
            note: blockade.note,
            roomId: RoomId.from(blockade.roomStatus.roomId),
            defects: blockade.defects.map((defect) => DefectId.from(defect.defectId)),
            finishedById: blockade.roomStatus.finishedById ? UserId.from(blockade.roomStatus.finishedById) : null,
            finishedAt: blockade.roomStatus.finishedAt ?? null,
            startedById: UserId.from(blockade.roomStatus.startedById),
            startedAt: blockade.roomStatus.startedAt,
            createdAt: blockade.roomStatus.createdAt,
            updatedAt: blockade.roomStatus.updatedAt,
        });
    }

    private static denormalize(blockade: Blockade): BlockadeModel {
        return {
            id: blockade.id.toString(),
            note: blockade.note,
            defects: blockade.defects.map((defectId) => ({
                defectId: defectId.toString(),
                blockadeId: blockade.id.toString(),
            })),
            roomStatus: {
                id: blockade.id.toString(),
                companyId: blockade.companyId.toString(),
                roomId: blockade.roomId.toString(),
                startedById: blockade.startedById.toString(),
                startedAt: blockade.startedAt,
                finishedById: blockade.finishedById?.toString() ?? null,
                finishedAt: blockade.finishedAt ?? null,
                createdAt: blockade.createdAt,
                updatedAt: blockade.updatedAt,
            },
        };
    }

    async findById(id: RoomStatusId): Promise<Blockade | null> {
        const blockade = await this.prisma.blockade.findUnique({
            where: {
                id: id.toString(),
            },
            ...blockadeWithRoomStatus,
        });

        return blockade === null ? null : BlockadePrismaRepository.normalize(blockade);
    }

    async findByRoom(roomId: RoomId): Promise<Blockade | null> {
        const blockade = await this.prisma.blockade.findFirst({
            where: {
                roomStatus: {
                    roomId: roomId.toString(),
                    finishedById: null,
                },
            },
            ...blockadeWithRoomStatus,
        });

        return blockade === null ? null : BlockadePrismaRepository.normalize(blockade);
    }

    async search(
        companyId: CompanyId,
        pagination: Pagination<BlockadeSortOptions>,
        filter: BlockadeSearchFilter = {}
    ): Promise<PaginatedList<Blockade>> {
        const where: PrismaClient.Prisma.BlockadeWhereInput = {
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

        const [blockades, totalCount] = await Promise.all([
            this.prisma.blockade.findMany({
                where,
                ...(pagination.cursor && {
                    cursor: {
                        id: pagination.cursor,
                    },
                }),
                ...blockadeWithRoomStatus,
                take: pagination.limit + 1,
                orderBy: [
                    ...this.normalizeSort({note}),
                    ...this.normalizeSort(roomStatusSort).map((sort) => ({roomStatus: sort})),
                    {id: 'asc'},
                ],
            }),
            this.prisma.blockade.count({where}),
        ]);

        return {
            data: blockades.slice(0, pagination.limit).map((blockade) => BlockadePrismaRepository.normalize(blockade)),
            totalCount,
            nextCursor: blockades.length > pagination.limit ? blockades[blockades.length - 1].id : null,
        };
    }

    async save(blockade: Blockade): Promise<void> {
        const {id, roomStatus, defects, ...blockadeModel} = BlockadePrismaRepository.denormalize(blockade);
        const defectsModel = defects.map((defect) => ({
            defectId: defect.defectId,
        }));

        await this.prisma.roomStatus.upsert({
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
    }
}
