import * as fs from 'fs';
import * as path from 'path';
import {Injectable} from '@nestjs/common';
import type {MulterModuleOptions, MulterOptionsFactory} from '@nestjs/platform-express';
import {diskStorage} from 'multer';
import {EnvConfigService} from '../../../infrastructure/config';

@Injectable()
export class UploadConfigService implements MulterOptionsFactory {
    constructor(private readonly config: EnvConfigService) {}

    createMulterOptions(): MulterModuleOptions {
        return {
            storage: diskStorage({
                destination: (_req, _file, cb) => {
                    const tempDir = path.join(this.config.storage.localUploadDir, 'temp');

                    fs.mkdirSync(tempDir, {recursive: true});
                    cb(null, tempDir);
                },
                filename: (req, _file, cb) => {
                    const tempPath: string = req.body?.tempPath ?? '';

                    cb(null, path.basename(tempPath));
                },
            }),
            limits: {fileSize: this.config.storage.uploadFileMaxSize},
        };
    }
}
