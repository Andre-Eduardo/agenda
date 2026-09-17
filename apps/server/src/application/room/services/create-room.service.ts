import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {CreateRoomDto, RoomDto} from '@application/room/dtos';
import {EventDispatcher} from '@domain/event';
import {Room} from '@domain/room/entities';
import {RoomRepository} from '@domain/room/room.repository';

@Injectable()
export class CreateRoomService implements ApplicationService<CreateRoomDto, RoomDto> {
    constructor(
        private readonly roomRepository: RoomRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreateRoomDto>): Promise<RoomDto> {
        const room = Room.create({
            clinicId: actor.clinicId,
            name: payload.name,
            active: true,
        });

        await this.roomRepository.save(room);
        this.eventDispatcher.dispatch(actor, room);

        return new RoomDto(room);
    }
}
