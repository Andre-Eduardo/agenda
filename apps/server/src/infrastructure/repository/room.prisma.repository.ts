import {Injectable} from '@nestjs/common';
import PrismaClient, {Prisma} from '@prisma/client';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {CompanyId} from '../../domain/company/entities';
import {Room, RoomId} from '../../domain/room/entities';
import {RoomState} from '../../domain/room/models/room-state';
import {DuplicateNumberException} from '../../domain/room/room.exceptions';
import {RoomRepository, RoomSearchFilter, RoomSortOptions} from '../../domain/room/room.repository';
import {RoomCategoryId} from '../../domain/room-category/entities';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';

export type RoomModel = PrismaClient.Room;

@Injectable()
export class RoomPrismaRepository extends PrismaRepository implements RoomRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    private static normalize(room: RoomModel): Room {
        return new Room({
            ...room,
            id: RoomId.from(room.id),
            companyId: CompanyId.from(room.companyId),
            categoryId: RoomCategoryId.from(room.categoryId),
            state: RoomState[room.state],
            stateSnapshot: room.stateSnapshot as Room['stateSnapshot'],
        });
    }

    private static denormalize(room: Room): RoomModel {
        return {
            id: room.id.toString(),
            companyId: room.companyId.toString(),
            categoryId: room.categoryId.toString(),
            number: room.number,
            name: room.name,
            state: room.state,
            stateSnapshot: room.stateSnapshot as RoomModel['stateSnapshot'],
            createdAt: room.createdAt,
            updatedAt: room.updatedAt,
        };
    }

    async findById(id: RoomId): Promise<Room | null> {
        const room = await this.prisma.room.findUnique({
            where: {
                id: id.toString(),
            },
        });

        return room === null ? null : RoomPrismaRepository.normalize(room);
    }

    async findAll(): Promise<Room[]> {
        const rooms = await this.prisma.room.findMany();

        return rooms.map((room) => RoomPrismaRepository.normalize(room));
    }

    async search(
        companyId: CompanyId,
        pagination: Pagination<RoomSortOptions>,
        filter?: RoomSearchFilter
    ): Promise<PaginatedList<Room>> {
        const where: Prisma.RoomWhereInput = {
            companyId: companyId.toString(),
            name: {
                mode: 'insensitive',
                contains: filter?.name,
            },
            number: filter?.number,
            categoryId: filter?.categoryId?.toString(),
        };

        const [rooms, totalCount] = await Promise.all([
            this.prisma.room.findMany({
                where,
                ...(pagination.cursor && {
                    cursor: {
                        id: pagination.cursor,
                    },
                }),
                take: pagination.limit + 1,
                orderBy: this.normalizeSort(pagination.sort, {id: 'asc'}),
            }),
            this.prisma.room.count({where}),
        ]);

        return {
            data: rooms.slice(0, pagination.limit).map((room) => RoomPrismaRepository.normalize(room)),
            totalCount,
            nextCursor: rooms.length > pagination.limit ? rooms[rooms.length - 1].id : null,
        };
    }

    async save(room: Room): Promise<void> {
        const {stateSnapshot, ...roomModel} = RoomPrismaRepository.denormalize(room);

        try {
            await this.prisma.room.upsert({
                where: {
                    id: roomModel.id,
                },
                create: {
                    ...roomModel,
                    stateSnapshot: stateSnapshot === null ? Prisma.DbNull : stateSnapshot,
                },
                update: {
                    ...roomModel,
                    stateSnapshot: stateSnapshot === null ? Prisma.DbNull : stateSnapshot,
                },
            });
        } catch (e) {
            if (this.checkUniqueViolation(e, 'number')) {
                throw new DuplicateNumberException('Duplicate room number.');
            }

            throw e;
        }
    }

    async delete(id: RoomId): Promise<void> {
        await this.prisma.room.delete({
            where: {
                id: id.toString(),
            },
        });
    }
}
