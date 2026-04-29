import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { ScheduleModule } from "@nestjs/schedule";
import { ServeStaticModule } from "@nestjs/serve-static";
import { FileStorageType } from "@domain/file/entities";
import { EnvConfigService } from "@infrastructure/config";
import { InfrastructureModule } from "@infrastructure/infrastructure.module";
import { StorageModule } from "@infrastructure/storage/storage.module";
import { ServeStaticConfigService } from "@application/upload/config/serve-static-config.service";
import { UploadConfigService } from "@application/upload/config/upload-config.service";
import { UploadController } from "@application/upload/controllers/upload.controller";
import { FilePromotionListener } from "@application/upload/listeners/file-promotion.listener";
import { FileValidationPipe } from "@application/upload/pipes/file-validation.pipe";
import { FilePromotionJob } from "@application/upload/schedules/file-promotion.job";
import { TempCleanupJob } from "@application/upload/schedules/temp-cleanup.job";
import { PrepareUploadService } from "@application/upload/services/prepare-upload.service";
import { PromoteFileService } from "@application/upload/services/promote-file.service";

@Module({
  imports: [
    InfrastructureModule,
    StorageModule,
    ScheduleModule.forRoot(),
    MulterModule.registerAsync({
      imports: [InfrastructureModule],
      useClass: UploadConfigService,
    }),
    ServeStaticModule.forRootAsync({
      imports: [InfrastructureModule],
      useClass: ServeStaticConfigService,
      extraProviders: [
        {
          provide: "STORAGE_TYPE_CHECK",
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
