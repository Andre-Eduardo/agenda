import {Injectable} from '@nestjs/common';
import {File, FileId, Record} from '../../../domain/record/entities';
import {RecordRepository} from '../../../domain/record/record.repository';
import {EventDispatcher} from '../../../domain/event';
import {ApplicationService, Command} from '../../@shared/application.service';
import {CreateRecordDto, RecordDto} from '../dtos';

@Injectable()
export class CreateRecordService implements ApplicationService<CreateRecordDto, RecordDto> {
    constructor(
        private readonly recordRepository: RecordRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreateRecordDto>): Promise<RecordDto> {
        const now = new Date();

        const record = Record.create({
            patientId: payload.patientId,
            professionalId: payload.professionalId,
            description: payload.description,
            files: [],
        });

        if (payload.files && payload.files.length > 0) {
            const files = payload.files.map(
                (f) =>
                    new File({
                        id: FileId.generate(),
                        recordId: record.id,
                        fileName: f.fileName,
                        url: f.url,
                        description: f.description,
                        createdAt: now,
                        updatedAt: now,
                        deletedAt: null,
                    })
            );

            record.files = files;
        }

        await this.recordRepository.save(record);

        this.eventDispatcher.dispatch(actor, record);

        return new RecordDto(record);
    }
}
