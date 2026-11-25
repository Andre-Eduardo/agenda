import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {RecordAuthorAccess} from '@application/clinic-patient-access/services/record-author-access.service';
import {GetRecordDto, RecordDto} from '@application/record/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {RecordRepository} from '@domain/record/record.repository';

@Injectable()
export class GetRecordService implements ApplicationService<GetRecordDto, RecordDto> {
    constructor(
        private readonly recordAuthorAccess: RecordAuthorAccess,
        private readonly recordRepository: RecordRepository
    ) {}

    async execute({actor, payload}: Command<GetRecordDto>): Promise<RecordDto> {
        const record = await this.recordRepository.findById(payload.id);

        if (record === null) {
            throw new ResourceNotFoundException('Record not found.', payload.id.toString());
        }

        await this.recordAuthorAccess.assertCanRead(actor, record);

        return new RecordDto(record);
    }
}
