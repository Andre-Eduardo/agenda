import * as path from 'path';
import {Inject, Injectable} from '@nestjs/common';
import {EventEmitter2} from '@nestjs/event-emitter';
import {FileStorage, FilePaths} from '../../../domain/@shared/storage/file-storage';
import {FilePromotionStatus, UploadFileId} from '../../../domain/file/entities';
import {FileReadyEvent} from '../../../domain/file/events';
import {UploadFileRepository} from '../../../domain/file/upload-file.repository';
import type {MaybeAuthenticatedActor} from '../../../domain/@shared/actor';
import type {ApplicationService, Command} from '../../@shared/application.service';

export type PromoteFileDto = {fileId: UploadFileId};

const MAX_PROMOTION_ATTEMPTS = 5;

@Injectable()
export class PromoteFileService implements ApplicationService<PromoteFileDto, void, MaybeAuthenticatedActor> {
    constructor(
        private readonly uploadFileRepository: UploadFileRepository,
        private readonly eventEmitter: EventEmitter2,
        @Inject(FileStorage) private readonly fileStorage: FileStorage
    ) {}

    async execute({actor, payload}: Command<PromoteFileDto, MaybeAuthenticatedActor>): Promise<void> {
        const file = await this.uploadFileRepository.findById(payload.fileId);
        if (!file) return;

        if (file.status === FilePromotionStatus.READY || file.status === FilePromotionStatus.FAILED) return;

        const ext = path.extname(file.tempPath);
        const finalPath = FilePaths.final(`${file.id}${ext}`);

        try {
            file.markInProgress();
            await this.uploadFileRepository.save(file);

            await this.fileStorage.promote(file.tempPath, finalPath);

            const info = await this.fileStorage.getFileInfo(finalPath);

            file.markReady(finalPath, info?.size, info?.checksum);
            await this.uploadFileRepository.save(file);

            this.eventEmitter.emit(FileReadyEvent.type, {actor, payload: new FileReadyEvent({file})});
        } catch {
            file.incrementAttempts();

            if (file.promotionAttempts >= MAX_PROMOTION_ATTEMPTS) {
                file.markFailed();
            } else {
                file.markPending();
            }

            await this.uploadFileRepository.save(file);
        }
    }
}
