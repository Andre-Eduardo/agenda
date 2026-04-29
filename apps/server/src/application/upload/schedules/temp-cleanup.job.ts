import { Injectable, Inject } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { FileStorage } from "@domain/@shared/storage/file-storage";
import { UploadFileRepository } from "@domain/file/upload-file.repository";

@Injectable()
export class TempCleanupJob {
  constructor(
    private readonly uploadFileRepository: UploadFileRepository,
    @Inject(FileStorage) private readonly fileStorage: FileStorage,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handle(): Promise<void> {
    const cutoffHours = 24;
    const cutoff = new Date(Date.now() - cutoffHours * 60 * 60 * 1000);
    const oldFiles = await this.uploadFileRepository.findOldTemp(cutoff);

    for (const file of oldFiles) {
      await this.fileStorage.delete(file.tempPath);
      await this.uploadFileRepository.delete(file);
    }
  }
}
