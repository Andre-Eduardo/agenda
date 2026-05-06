import {Injectable} from '@nestjs/common';
import {z} from 'zod';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {getRecordSchema} from '@application/record/dtos';
import {ResourceNotFoundException} from '@domain/@shared/exceptions';
import {EventDispatcher} from '@domain/event';
import {RecordRepository} from '@domain/record/record.repository';

type DeleteRecordDto = z.infer<typeof getRecordSchema>;

@Injectable()
export class DeleteRecordService implements ApplicationService<DeleteRecordDto> {
    constructor(
        private readonly recordRepository: RecordRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<DeleteRecordDto>): Promise<void> {
        const record = await this.recordRepository.findById(payload.id);

        if (record === null) {
            throw new ResourceNotFoundException('Record not found.', payload.id.toString());
        }

        record.delete();

        await this.recordRepository.delete(record.id);

        this.eventDispatcher.dispatch(actor, record);
    }
}
