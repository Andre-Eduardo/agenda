import {Injectable} from '@nestjs/common';
import {RecordRepository} from '../../../domain/record/record.repository';
import {PaginatedDto} from '../../@shared/dto';
import {ApplicationService, Command} from '../../@shared/application.service';
import {RecordDto, SearchRecordsDto} from '../dtos';

@Injectable()
export class SearchRecordsService implements ApplicationService<SearchRecordsDto, PaginatedDto<RecordDto>> {
    constructor(private readonly recordRepository: RecordRepository) {}

    async execute({payload}: Command<SearchRecordsDto>): Promise<PaginatedDto<RecordDto>> {
        const {term, sort, ...rest} = payload;

        const result = await this.recordRepository.search(
            {
                ...rest,
                sort: sort ? Object.entries(sort).map(([key, direction]) => ({key, direction})) : undefined,
            },
            {term: term ?? undefined}
        );

        return {
            data: result.data.map((record) => new RecordDto(record)),
            totalCount: result.totalCount,
        };
    }
}
