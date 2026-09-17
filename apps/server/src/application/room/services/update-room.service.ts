import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {RoomDto, UpdateRoomDto} from '@application/room/dtos';
import {PreconditionException, ResourceNotFoundException} from '@domain/@shared/exceptions';
import {EventDispatcher} from '@domain/event';
import {RoomRepository} from '@domain/room/room.repository';

@Injectable()
export class UpdateRoomService implements ApplicationService<UpdateRoomDto, RoomDto> {
    constructor(
        private readonly roomRepository: RoomRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload: {id, ...props}}: Command<UpdateRoomDto>): Promise<RoomDto> {
        const room = await this.roomRepository.findById(id);

        if (room === null) {
            throw new ResourceNotFoundException('room.not_found', id.toString());
        }

        if (!room.clinicId.equals(actor.clinicId)) {
            throw new PreconditionException('Room does not belong to the current clinic.');
        }

        room.change(props);

        await this.roomRepository.save(room);
        this.eventDispatcher.dispatch(actor, room);

        return new RoomDto(room);
    }
}
