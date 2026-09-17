import {Injectable} from '@nestjs/common';
import {ClinicId} from '@domain/clinic/entities';
import {Room, RoomId} from '@domain/room/entities';
import {RoomRepository} from '@domain/room/room.repository';
import {RoomMapper} from '@infrastructure/mappers/room.mapper';
import {PrismaRepository} from '@infrastructure/repository/prisma.repository';
import {PrismaProvider} from '@infrastructure/repository/prisma/prisma.provider';

@Injectable()
export class RoomPrismaRepository extends PrismaRepository implements RoomRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: RoomMapper
    ) {
        super(prismaProvider);
    }

    async findById(id: RoomId): Promise<Room | null> {
        const room = await this.prisma.room.findFirst({where: {id: id.toString()}});

        return room === null ? null : this.mapper.toDomain(room);
    }

    async findByClinicId(clinicId: ClinicId): Promise<Room[]> {
        const rooms = await this.prisma.room.findMany({
            where: {clinicId: clinicId.toString(), deletedAt: null},
            orderBy: {name: 'asc'},
        });

        return rooms.map((room) => this.mapper.toDomain(room));
    }

    async save(room: Room): Promise<void> {
        const data = this.mapper.toPersistence(room);

        await this.prisma.room.upsert({
            where: {id: data.id},
            create: data,
            update: data,
        });
    }

    async delete(id: RoomId): Promise<void> {
        await this.prisma.room.delete({where: {id: id.toString()}});
    }
}
