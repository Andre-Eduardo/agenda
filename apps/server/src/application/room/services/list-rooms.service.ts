import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {RoomDto} from '@application/room/dtos';
import {RoomRepository} from '@domain/room/room.repository';

@Injectable()
export class ListRoomsService implements ApplicationService<undefined, RoomDto[]> {
    constructor(private readonly roomRepository: RoomRepository) {}

    async execute({actor}: Command): Promise<RoomDto[]> {
        const rooms = await this.roomRepository.findByClinicId(actor.clinicId);

        return rooms.map((room) => new RoomDto(room));
    }
}
