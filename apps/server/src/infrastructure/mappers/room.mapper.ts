import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {ClinicId} from '@domain/clinic/entities';
import {Room, RoomId} from '@domain/room/entities';
import {MapperWithoutDto} from '@infrastructure/mappers/mapper';

export type RoomModel = PrismaClient.Room;

@Injectable()
export class RoomMapper extends MapperWithoutDto<Room, RoomModel> {
    toDomain(model: RoomModel): Room {
        return new Room({
            id: RoomId.from(model.id),
            clinicId: ClinicId.from(model.clinicId),
            name: model.name,
            active: model.active,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: model.deletedAt ?? null,
        });
    }

    toPersistence(entity: Room): RoomModel {
        return {
            id: entity.id.toString(),
            clinicId: entity.clinicId.toString(),
            name: entity.name,
            active: entity.active,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt ?? null,
        };
    }
}
