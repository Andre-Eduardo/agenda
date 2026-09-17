import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {PreconditionException, ResourceNotFoundException} from '@domain/@shared/exceptions';
import {EventDispatcher} from '@domain/event';
import {RoomId} from '@domain/room/entities';
import {RoomRepository} from '@domain/room/room.repository';

type DeleteRoomPayload = {id: RoomId};

@Injectable()
export class DeleteRoomService implements ApplicationService<DeleteRoomPayload> {
    constructor(
        private readonly roomRepository: RoomRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<DeleteRoomPayload>): Promise<void> {
        const room = await this.roomRepository.findById(payload.id);

        if (room === null) {
            throw new ResourceNotFoundException('room.not_found', payload.id.toString());
        }

        if (!room.clinicId.equals(actor.clinicId)) {
            throw new PreconditionException('Room does not belong to the current clinic.');
        }

        room.delete();

        await this.roomRepository.delete(room.id);
        this.eventDispatcher.dispatch(actor, room);
    }
}
