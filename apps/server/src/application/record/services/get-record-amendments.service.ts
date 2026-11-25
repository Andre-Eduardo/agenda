import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {RecordAuthorAccess} from '@application/clinic-patient-access/services/record-author-access.service';
import {GetRecordDto, RecordAmendmentDto} from '@application/record/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {RecordAmendmentRepository} from '@domain/record/record-amendment.repository';
import {RecordRepository} from '@domain/record/record.repository';

@Injectable()
export class GetRecordAmendmentsService implements ApplicationService<GetRecordDto, RecordAmendmentDto[]> {
    constructor(
        private readonly recordAuthorAccess: RecordAuthorAccess,
        private readonly recordRepository: RecordRepository,
        private readonly recordAmendmentRepository: RecordAmendmentRepository
    ) {}

    async execute({actor, payload}: Command<GetRecordDto>): Promise<RecordAmendmentDto[]> {
        const record = await this.recordRepository.findById(payload.id);

        if (record === null) {
            throw new ResourceNotFoundException('Record not found.', payload.id.toString());
        }

        await this.recordAuthorAccess.assertCanRead(actor, record);

        const amendments = await this.recordAmendmentRepository.findAllByRecordId(payload.id, actor.clinicId);

        return amendments.map(({amendment, requestedByName}) => new RecordAmendmentDto(amendment, requestedByName));
    }
}
