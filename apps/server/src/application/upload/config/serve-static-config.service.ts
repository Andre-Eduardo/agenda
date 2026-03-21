import {Injectable} from '@nestjs/common';
import type {ServeStaticModuleOptions, ServeStaticModuleOptionsFactory} from '@nestjs/serve-static';
import {EnvConfigService} from '../../../infrastructure/config';

@Injectable()
export class ServeStaticConfigService implements ServeStaticModuleOptionsFactory {
    constructor(private readonly config: EnvConfigService) {}

    createLoggerOptions(): ServeStaticModuleOptions[] {
        return [
            {
                rootPath: this.config.storage.localUploadDir,
                serveRoot: '/uploads',
                exclude: ['/api/(.*)'],
            },
        ];
    }
}
