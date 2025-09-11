import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {RoomRepository} from '../../../domain/room/room.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {DeleteRoomDto} from '../dtos';

@Injectable()
export class DeleteRoomService implements ApplicationService<DeleteRoomDto> {
    constructor(
        private readonly roomRepository: RoomRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<DeleteRoomDto>): Promise<void> {
        const room = await this.roomRepository.findById(payload.id);

        if (!room) {
            throw new ResourceNotFoundException('Room not found', payload.id.toString());
        }

        room.delete();

        await this.roomRepository.delete(payload.id);

        this.eventDispatcher.dispatch(actor, room);
    }
}
