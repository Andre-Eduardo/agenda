import {Injectable} from '@nestjs/common';
import {OnEvent} from '@nestjs/event-emitter';
import {PromoteFileService} from '@application/upload/services/promote-file.service';
import type {Event} from '@domain/event';
import {FileUploadedEvent} from '@domain/file/events';

@Injectable()
export class FilePromotionListener {
    constructor(private readonly promoteFileService: PromoteFileService) {}

    @OnEvent(FileUploadedEvent.type)
    async handle({actor, payload}: Event<FileUploadedEvent>): Promise<void> {
        await this.promoteFileService.execute({
            actor,
            payload: {fileId: payload.file.id},
        });
    }
}
