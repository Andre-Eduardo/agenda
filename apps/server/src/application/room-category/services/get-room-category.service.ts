import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {RoomCategoryRepository} from '../../../domain/room-category/room-category.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {GetRoomCategoryDto, RoomCategoryDto} from '../dtos';

@Injectable()
export class GetRoomCategoryService implements ApplicationService<GetRoomCategoryDto, RoomCategoryDto> {
    constructor(private readonly roomCategoryRepository: RoomCategoryRepository) {}

    async execute({payload}: Command<GetRoomCategoryDto>): Promise<RoomCategoryDto> {
        const roomCategory = await this.roomCategoryRepository.findById(payload.id);

        if (roomCategory === null) {
            throw new ResourceNotFoundException('Room category not found', payload.id.toString());
        }

        return new RoomCategoryDto(roomCategory);
    }
}
