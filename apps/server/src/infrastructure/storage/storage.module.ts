import { Module } from "@nestjs/common";
import { FileStorage } from "@domain/@shared/storage/file-storage";
import { FileStorageType } from "@domain/file/entities";
import { ConfigModule, EnvConfigService } from "@infrastructure/config";
import { LocalFileStorage } from "@infrastructure/storage/local-file.storage";
import { S3FileStorage } from "@infrastructure/storage/s3-file.storage";

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: FileStorage,
      useFactory: (config: EnvConfigService) => {
        if (config.storage.type === FileStorageType.S3) {
          return new S3FileStorage(config);
        }

        return new LocalFileStorage(config);
      },
      inject: [EnvConfigService],
    },
  ],
  exports: [FileStorage],
})
export class StorageModule {}
