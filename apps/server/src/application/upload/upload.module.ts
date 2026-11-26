import {Module} from '@nestjs/common';
import {MulterModule} from '@nestjs/platform-express';
import {ScheduleModule} from '@nestjs/schedule';
import {UploadConfigService} from '@application/upload/config/upload-config.service';
import {UploadController} from '@application/upload/controllers/upload.controller';
import {FilePromotionListener} from '@application/upload/listeners/file-promotion.listener';
import {FileValidationPipe} from '@application/upload/pipes/file-validation.pipe';
import {FilePromotionJob} from '@application/upload/schedules/file-promotion.job';
import {TempCleanupJob} from '@application/upload/schedules/temp-cleanup.job';
import {PrepareUploadService} from '@application/upload/services/prepare-upload.service';
import {PromoteFileService} from '@application/upload/services/promote-file.service';
import {InfrastructureModule} from '@infrastructure/infrastructure.module';
import {StorageModule} from '@infrastructure/storage/storage.module';

@Module({
    imports: [
        InfrastructureModule,
        StorageModule,
        ScheduleModule.forRoot(),
        MulterModule.registerAsync({
            imports: [InfrastructureModule],
            useClass: UploadConfigService,
        }),
        // Local uploads are served by setupApp behind a session check (protected-uploads.handler.ts).
    ],
    controllers: [UploadController],
    providers: [
        UploadConfigService,
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
