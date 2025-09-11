import {Injectable} from '@nestjs/common';
import {
    DuplicateNameException,
    PreconditionException,
    ResourceNotFoundException,
} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {DuplicateAcronymException} from '../../../domain/room-category/room-category.exceptions';
import {RoomCategoryRepository} from '../../../domain/room-category/room-category.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {RoomCategoryDto, UpdateRoomCategoryDto} from '../dtos';

@Injectable()
export class UpdateRoomCategoryService implements ApplicationService<UpdateRoomCategoryDto, RoomCategoryDto> {
    constructor(
        private readonly roomCategoryRepository: RoomCategoryRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<UpdateRoomCategoryDto>): Promise<RoomCategoryDto> {
        const roomCategory = await this.roomCategoryRepository.findById(payload.id);

        if (roomCategory === null) {
            throw new ResourceNotFoundException('Room category not found', payload.id.toString());
        }

        roomCategory.change(payload);

        try {
            await this.roomCategoryRepository.save(roomCategory);
        } catch (e) {
            if (e instanceof DuplicateNameException) {
                throw new PreconditionException('Cannot update a room category with a name already in use.');
            }

            if (e instanceof DuplicateAcronymException) {
                throw new PreconditionException('Cannot update a room category with an acronym already in use.');
            }

            throw e;
        }

        this.eventDispatcher.dispatch(actor, roomCategory);

        return new RoomCategoryDto(roomCategory);
    }
}
