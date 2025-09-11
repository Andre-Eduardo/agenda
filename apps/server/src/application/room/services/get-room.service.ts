import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {RoomRepository} from '../../../domain/room/room.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {GetRoomDto, RoomDto} from '../dtos';

@Injectable()
export class GetRoomService implements ApplicationService<GetRoomDto, RoomDto> {
    constructor(private readonly roomRepository: RoomRepository) {}

    async execute({payload}: Command<GetRoomDto>): Promise<RoomDto> {
        const room = await this.roomRepository.findById(payload.id);

        if (!room) {
            throw new ResourceNotFoundException('Room not found', payload.id.toString());
        }

        return new RoomDto(room);
    }
}
