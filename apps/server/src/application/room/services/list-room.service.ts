import {Injectable} from '@nestjs/common';
import {RoomRepository} from '../../../domain/room/room.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {PaginatedDto} from '../../@shared/dto';
import {RoomDto, ListRoomDto} from '../dtos';

@Injectable()
export class ListRoomService implements ApplicationService<ListRoomDto, PaginatedDto<RoomDto>> {
    constructor(private readonly roomRepository: RoomRepository) {}

    async execute({payload}: Command<ListRoomDto>): Promise<PaginatedDto<RoomDto>> {
        const result = await this.roomRepository.search(
            payload.companyId,
            {
                cursor: payload.pagination.cursor ?? undefined,
                limit: payload.pagination.limit,
                sort: payload.pagination.sort ?? {},
            },
            {
                name: payload.name,
                number: payload.number,
                categoryId: payload.categoryId,
            }
        );

        return {
            ...result,
            data: result.data.map((room) => new RoomDto(room)),
        };
    }
}
