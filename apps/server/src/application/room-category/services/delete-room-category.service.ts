import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {RoomCategoryRepository} from '../../../domain/room-category/room-category.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {DeleteRoomCategoryDto} from '../dtos';

@Injectable()
export class DeleteRoomCategoryService implements ApplicationService<DeleteRoomCategoryDto> {
    constructor(
        private readonly roomCategoryRepository: RoomCategoryRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<DeleteRoomCategoryDto>): Promise<void> {
        const roomCategory = await this.roomCategoryRepository.findById(payload.id);

        if (roomCategory === null) {
            throw new ResourceNotFoundException('Room category not found', payload.id.toString());
        }

        roomCategory.delete();

        await this.roomCategoryRepository.delete(roomCategory.id);

        this.eventDispatcher.dispatch(actor, roomCategory);
    }
}
