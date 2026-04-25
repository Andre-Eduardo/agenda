import {Injectable} from '@nestjs/common';
import {AccessDeniedException, AccessDeniedReason, ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {ImportedDocumentId} from '../../../domain/record/entities';
import {RecordRepository} from '../../../domain/record/record.repository';
import {EventDispatcher} from '../../../domain/event';
import {ApplicationService, Command} from '../../@shared/application.service';
import {RecordDto, UpdateRecordDto} from '../dtos';

@Injectable()
export class UpdateRecordService implements ApplicationService<UpdateRecordDto, RecordDto> {
    constructor(
        private readonly recordRepository: RecordRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload: {id, ...props}}: Command<UpdateRecordDto>): Promise<RecordDto> {
        const record = await this.recordRepository.findById(id);

        if (record === null) {
            throw new ResourceNotFoundException('Record not found.', id.toString());
        }

        if (record.isLocked) {
            throw new AccessDeniedException('RECORD_LOCKED', AccessDeniedReason.NOT_ALLOWED);
        }

        const changeProps = {
            ...props,
            importedDocumentId: props.importedDocumentId !== undefined 
                ? (props.importedDocumentId ? ImportedDocumentId.from(props.importedDocumentId) : null) 
                : undefined,
        };

        record.change(changeProps);

        await this.recordRepository.save(record);

        this.eventDispatcher.dispatch(actor, record);

        return new RecordDto(record);
    }
}
