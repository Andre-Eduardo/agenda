import {Injectable} from '@nestjs/common';
import {OnEvent} from '@nestjs/event-emitter';
import type {Event} from '../../../domain/event';
import {FileUploadedEvent} from '../../../domain/file/events';
import {UploadFileId} from '../../../domain/file/entities';
import {PromoteFileService} from '../services/promote-file.service';

@Injectable()
export class FilePromotionListener {
    constructor(private readonly promoteFileService: PromoteFileService) {}

    @OnEvent(FileUploadedEvent.type)
    async handle({actor, payload}: Event<FileUploadedEvent>): Promise<void> {
        await this.promoteFileService.execute({
            actor,
            payload: {fileId: payload.file.id as UploadFileId},
        });
    }
}
