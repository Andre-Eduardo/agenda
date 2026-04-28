import {Injectable, PipeTransform} from '@nestjs/common';
import {InvalidInputException} from '../../../domain/@shared/exceptions';
import {ALLOWED_MIME_TYPES} from '../../../domain/@shared/storage/file-storage';
import {EnvConfigService} from '../../../infrastructure/config';

export const UploadExceptions = {
    no_file_uploaded: 'No file was uploaded.',
    unsupported_file_type: 'File type is not supported.',
    file_size_exceeded: 'File size exceeds the allowed limit.',
} as const;

@Injectable()
export class FileValidationPipe implements PipeTransform<Express.Multer.File, Express.Multer.File> {
    constructor(private readonly config: EnvConfigService) {}

    transform(file: Express.Multer.File): Express.Multer.File {
        if (!file) {
            throw new InvalidInputException(UploadExceptions.no_file_uploaded);
        }

        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new InvalidInputException(UploadExceptions.unsupported_file_type, [
                {field: 'file', reason: `MIME type "${file.mimetype}" is not allowed.`},
            ]);
        }

        if (file.size > this.config.storage.uploadFileMaxSize) {
            const maxMb = (this.config.storage.uploadFileMaxSize / (1024 * 1024)).toFixed(0);

            throw new InvalidInputException(UploadExceptions.file_size_exceeded, [
                {field: 'file', reason: `File size exceeds the ${maxMb}MB limit.`},
            ]);
        }

        return file;
    }
}
