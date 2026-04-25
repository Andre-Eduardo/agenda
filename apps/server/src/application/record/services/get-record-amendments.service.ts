import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {RecordAmendmentRepository} from '../../../domain/record/record-amendment.repository';
import {RecordRepository} from '../../../domain/record/record.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {GetRecordDto, RecordAmendmentDto} from '../dtos';

@Injectable()
export class GetRecordAmendmentsService implements ApplicationService<GetRecordDto, RecordAmendmentDto[]> {
    constructor(
        private readonly recordRepository: RecordRepository,
        private readonly recordAmendmentRepository: RecordAmendmentRepository,
    ) {}

    async execute({payload}: Command<GetRecordDto>): Promise<RecordAmendmentDto[]> {
        const record = await this.recordRepository.findById(payload.id);
        if (record === null) {
            throw new ResourceNotFoundException('Record not found.', payload.id.toString());
        }

        const amendments = await this.recordAmendmentRepository.findAllByRecordId(payload.id);
        return amendments.map((a) => new RecordAmendmentDto(a));
    }
}
