import {Injectable} from '@nestjs/common';
import {RecordRepository} from '../../../domain/record/record.repository';
import {PaginatedDto} from '../../@shared/dto';
import {ApplicationService, Command} from '../../@shared/application.service';
import {RecordDto, SearchRecordsDto} from '../dtos';

@Injectable()
export class SearchRecordsService implements ApplicationService<SearchRecordsDto, PaginatedDto<RecordDto>> {
    constructor(private readonly recordRepository: RecordRepository) {}

    async execute({payload}: Command<SearchRecordsDto>): Promise<PaginatedDto<RecordDto>> {
        const {term, sort, patientId, attendanceType, clinicalStatus, dateStart, dateEnd, source, ...rest} = payload;

        const result = await this.recordRepository.search(
            {
                ...rest,
                sort: sort ?? undefined,
            },
            {
                term: term ?? undefined,
                patientId: patientId ?? undefined,
                attendanceType: attendanceType ?? undefined,
                clinicalStatus: clinicalStatus ?? undefined,
                dateStart: dateStart ?? undefined,
                dateEnd: dateEnd ?? undefined,
                source: source ?? undefined,
            }
        );

        return {
            data: result.data.map((record) => new RecordDto(record)),
            totalCount: result.totalCount,
        };
    }
}
