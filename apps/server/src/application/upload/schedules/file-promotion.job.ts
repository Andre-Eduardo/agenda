import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { UploadFileRepository } from "@domain/file/upload-file.repository";
import { unknownActor } from "@domain/@shared/actor";
import { PromoteFileService } from "@application/upload/services/promote-file.service";

@Injectable()
export class FilePromotionJob {
  constructor(
    private readonly uploadFileRepository: UploadFileRepository,
    private readonly promoteFileService: PromoteFileService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handle(): Promise<void> {
    const pendingFiles = await this.uploadFileRepository.findPending();

    for (const file of pendingFiles) {
      await this.promoteFileService.execute({
        actor: unknownActor,
        payload: { fileId: file.id },
      });
    }
  }
}
