import {Injectable} from '@nestjs/common';
import {PreconditionException, ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {DuplicateNumberException} from '../../../domain/room/room.exceptions';
import {RoomRepository} from '../../../domain/room/room.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {RoomDto, UpdateRoomDto} from '../dtos';

@Injectable()
export class UpdateRoomService implements ApplicationService<UpdateRoomDto, RoomDto> {
    constructor(
        private readonly roomRepository: RoomRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<UpdateRoomDto>): Promise<RoomDto> {
        const room = await this.roomRepository.findById(payload.id);

        if (room === null) {
            throw new ResourceNotFoundException('Room not found', payload.id.toString());
        }

        room.change(payload);

        try {
            await this.roomRepository.save(room);
        } catch (e) {
            if (e instanceof DuplicateNumberException) {
                throw new PreconditionException('Cannot update a room with a number already in use.');
            }

            throw e;
        }

        this.eventDispatcher.dispatch(actor, room);

        return new RoomDto(room);
    }
}
