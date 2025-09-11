import {Injectable} from '@nestjs/common';
import {CleaningRepository} from '../../../domain/cleaning/cleaning.repository';
import type {ApplicationService, Command} from '../../@shared/application.service';
import {PaginatedDto} from '../../@shared/dto';
import {ListCleaningDto} from '../dtos';
import {CleaningDto} from '../dtos/cleaning.dto';

@Injectable()
export class ListCleaningService implements ApplicationService<ListCleaningDto, PaginatedDto<CleaningDto>> {
    constructor(private readonly cleaningRepository: CleaningRepository) {}

    async execute({payload}: Command<ListCleaningDto>): Promise<PaginatedDto<CleaningDto>> {
        const result = await this.cleaningRepository.search(
            payload.companyId,
            {
                cursor: payload.pagination.cursor ?? undefined,
                limit: payload.pagination.limit,
                sort: payload.pagination.sort ?? {},
            },
            {
                roomId: payload.roomId,
                startedById: payload.startedById,
                finishedById: payload.finishedById,
                endReason: payload.endReason,
            }
        );

        return {
            ...result,
            data: result.data.map((cleaning) => new CleaningDto(cleaning)),
        };
    }
}
