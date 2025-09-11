import {Injectable} from '@nestjs/common';
import {DuplicateNameException, PreconditionException} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {RoomCategory} from '../../../domain/room-category/entities';
import {DuplicateAcronymException} from '../../../domain/room-category/room-category.exceptions';
import {RoomCategoryRepository} from '../../../domain/room-category/room-category.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {RoomCategoryDto, CreateRoomCategoryDto} from '../dtos';

@Injectable()
export class CreateRoomCategoryService implements ApplicationService<CreateRoomCategoryDto, RoomCategoryDto> {
    constructor(
        private readonly roomCategoryRepository: RoomCategoryRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreateRoomCategoryDto>): Promise<RoomCategoryDto> {
        const roomCategory = RoomCategory.create(payload);

        try {
            await this.roomCategoryRepository.save(roomCategory);
        } catch (e) {
            if (e instanceof DuplicateNameException) {
                throw new PreconditionException('Cannot create a room category with a name already in use.');
            }

            if (e instanceof DuplicateAcronymException) {
                throw new PreconditionException('Cannot create a room category with an acronym already in use.');
            }

            throw e;
        }

        this.eventDispatcher.dispatch(actor, roomCategory);

        return new RoomCategoryDto(roomCategory);
    }
}
