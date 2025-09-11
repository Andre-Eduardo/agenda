import {Injectable} from '@nestjs/common';
import {RoomCategoryRepository} from '../../../domain/room-category/room-category.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {PaginatedDto} from '../../@shared/dto';
import {RoomCategoryDto, ListRoomCategoryDto} from '../dtos';

@Injectable()
export class ListRoomCategoryService implements ApplicationService<ListRoomCategoryDto, PaginatedDto<RoomCategoryDto>> {
    constructor(private readonly roomCategoryRepository: RoomCategoryRepository) {}

    async execute({payload}: Command<ListRoomCategoryDto>): Promise<PaginatedDto<RoomCategoryDto>> {
        const result = await this.roomCategoryRepository.search(
            payload.companyId,
            {
                cursor: payload.pagination.cursor ?? undefined,
                limit: payload.pagination.limit,
                sort: payload.pagination.sort ?? {},
            },
            {
                name: payload.name,
                acronym: payload.acronym,
            }
        );

        return {
            ...result,
            data: result.data.map((roomCategory) => new RoomCategoryDto(roomCategory)),
        };
    }
}
