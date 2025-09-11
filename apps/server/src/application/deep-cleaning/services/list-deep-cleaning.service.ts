import {Injectable} from '@nestjs/common';
import {DeepCleaningRepository} from '../../../domain/deep-cleaning/deep-cleaning.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {PaginatedDto} from '../../@shared/dto';
import {DeepCleaningDto, ListDeepCleaningDto} from '../dtos';

@Injectable()
export class ListDeepCleaningService implements ApplicationService<ListDeepCleaningDto, PaginatedDto<DeepCleaningDto>> {
    constructor(private readonly deepCleaningRepository: DeepCleaningRepository) {}

    async execute({payload}: Command<ListDeepCleaningDto>): Promise<PaginatedDto<DeepCleaningDto>> {
        const result = await this.deepCleaningRepository.search(
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
            data: result.data.map((deepCleaning) => new DeepCleaningDto(deepCleaning)),
        };
    }
}
