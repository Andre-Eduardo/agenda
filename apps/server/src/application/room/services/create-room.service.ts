import {Injectable} from '@nestjs/common';
import {PreconditionException} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {Room} from '../../../domain/room/entities';
import {DuplicateNumberException} from '../../../domain/room/room.exceptions';
import {RoomRepository} from '../../../domain/room/room.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {RoomDto, CreateRoomDto} from '../dtos';

@Injectable()
export class CreateRoomService implements ApplicationService<CreateRoomDto, RoomDto> {
    constructor(
        private readonly roomRepository: RoomRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreateRoomDto>): Promise<RoomDto> {
        const room = Room.create(payload);

        try {
            await this.roomRepository.save(room);
        } catch (e) {
            if (e instanceof DuplicateNumberException) {
                throw new PreconditionException('Cannot create a room with a number already in use.');
            }

            throw e;
        }

        this.eventDispatcher.dispatch(actor, room);

        return new RoomDto(room);
    }
}
