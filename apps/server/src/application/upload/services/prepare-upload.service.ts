import * as path from 'path';
import {Inject, Injectable} from '@nestjs/common';
import {uuidv7} from 'uuidv7';
import {InvalidInputException} from '../../../domain/@shared/exceptions';
import {FileStorage, FilePaths, ALLOWED_MIME_TYPES} from '../../../domain/@shared/storage/file-storage';
import {UploadFile} from '../../../domain/file/entities';
import {UploadFileRepository} from '../../../domain/file/upload-file.repository';
import {EnvConfigService} from '../../../infrastructure/config';
import type {ApplicationService, Command} from '../../@shared/application.service';
import type {PrepareUploadDto} from '../dtos/prepare-upload.dto';
import type {PreparedUploadDto} from '../dtos/prepared-upload.dto';
import {UploadExceptions} from '../pipes/file-validation.pipe';

@Injectable()
export class PrepareUploadService implements ApplicationService<PrepareUploadDto, PreparedUploadDto> {
    constructor(
        private readonly config: EnvConfigService,
        private readonly uploadFileRepository: UploadFileRepository,
        @Inject(FileStorage) private readonly fileStorage: FileStorage
    ) {}

    async execute({payload}: Command<PrepareUploadDto>): Promise<PreparedUploadDto> {
        if (!ALLOWED_MIME_TYPES.includes(payload.mimeType)) {
            throw new InvalidInputException(UploadExceptions.unsupported_file_type, [
                {field: 'mimeType', reason: `MIME type "${payload.mimeType}" is not allowed.`},
            ]);
        }

        if (payload.size > this.config.storage.uploadFileMaxSize) {
            const maxMb = (this.config.storage.uploadFileMaxSize / (1024 * 1024)).toFixed(0);

            throw new InvalidInputException(UploadExceptions.file_size_exceeded, [
                {field: 'size', reason: `File size exceeds the ${maxMb}MB limit.`},
            ]);
        }

        const ext = path.extname(payload.filename).toLowerCase();
        const tempPath = FilePaths.temp(`${uuidv7()}${ext}`);

        const upload = await this.fileStorage.prepareUpload(tempPath, payload.mimeType, payload.checksum);

        const uploadFile = UploadFile.create({
            tempPath,
            mimeType: payload.mimeType,
            size: payload.size,
            checksum: payload.checksum,
        });

        await this.uploadFileRepository.save(uploadFile);

        return {
            storageType: this.config.storage.type,
            fileId: uploadFile.id.toString(),
            tempPath,
            upload,
        };
    }
}
