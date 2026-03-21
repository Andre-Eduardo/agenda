import {Module} from '@nestjs/common';
import {MulterModule} from '@nestjs/platform-express';
import {ScheduleModule} from '@nestjs/schedule';
import {ServeStaticModule} from '@nestjs/serve-static';
import {FileStorageType} from '../../domain/file/entities';
import {EnvConfigService} from '../../infrastructure/config';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {StorageModule} from '../../infrastructure/storage/storage.module';
import {ServeStaticConfigService} from './config/serve-static-config.service';
import {UploadConfigService} from './config/upload-config.service';
import {UploadController} from './controllers/upload.controller';
import {FilePromotionListener} from './listeners/file-promotion.listener';
import {FileValidationPipe} from './pipes/file-validation.pipe';
import {FilePromotionJob} from './schedules/file-promotion.job';
import {TempCleanupJob} from './schedules/temp-cleanup.job';
import {PrepareUploadService} from './services/prepare-upload.service';
import {PromoteFileService} from './services/promote-file.service';

@Module({
    imports: [
        InfrastructureModule,
        StorageModule,
        ScheduleModule.forRoot(),
        MulterModule.registerAsync({
            imports: [InfrastructureModule],
            useClass: UploadConfigService,
        }),
        ServeStaticModule.registerAsync({
            imports: [InfrastructureModule],
            useClass: ServeStaticConfigService,
            extraProviders: [
                {
                    provide: 'STORAGE_TYPE_CHECK',
                    useFactory: (config: EnvConfigService) => config.storage.type === FileStorageType.LOCAL,
                    inject: [EnvConfigService],
                },
            ],
        }),
    ],
    controllers: [UploadController],
    providers: [
        UploadConfigService,
        ServeStaticConfigService,
        FileValidationPipe,
        PrepareUploadService,
        PromoteFileService,
        FilePromotionListener,
        FilePromotionJob,
        TempCleanupJob,
    ],
    exports: [PromoteFileService],
})
export class UploadModule {}
