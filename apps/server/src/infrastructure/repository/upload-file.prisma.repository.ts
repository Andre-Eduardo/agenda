import { Injectable } from "@nestjs/common";
import {
  FilePromotionStatus as PrismaFilePromotionStatus,
  type UploadFile as PrismaUploadFile,
} from "@prisma/client";
import { FilePromotionStatus, UploadFile, UploadFileId } from "@domain/file/entities";
import { UploadFileRepository } from "@domain/file/upload-file.repository";
import { toEnum } from "@domain/@shared/utils";
import { PrismaProvider } from "@infrastructure/repository/prisma/prisma.provider";
import { PrismaRepository } from "@infrastructure/repository/prisma.repository";

@Injectable()
export class UploadFilePrismaRepository extends PrismaRepository implements UploadFileRepository {
  // eslint-disable-next-line no-useless-constructor -- NestJS requires explicit constructor for DI
  constructor(readonly prismaProvider: PrismaProvider) {
    super(prismaProvider);
  }

  async findById(id: UploadFileId): Promise<UploadFile | null> {
    const model = await this.prisma.uploadFile.findUnique({ where: { id: id.toString() } });

    return model ? this.toDomain(model) : null;
  }

  async findPending(): Promise<UploadFile[]> {
    const models = await this.prisma.uploadFile.findMany({
      where: {
        status: { in: [PrismaFilePromotionStatus.PENDING, PrismaFilePromotionStatus.IN_PROGRESS] },
      },
    });

    return models.map((m) => this.toDomain(m));
  }

  async findOldTemp(before: Date): Promise<UploadFile[]> {
    const models = await this.prisma.uploadFile.findMany({
      where: {
        status: { in: [PrismaFilePromotionStatus.PENDING, PrismaFilePromotionStatus.FAILED] },
        createdAt: { lt: before },
      },
    });

    return models.map((m) => this.toDomain(m));
  }

  async save(file: UploadFile): Promise<void> {
    const data = {
      id: file.id.toString(),
      tempPath: file.tempPath,
      finalPath: file.finalPath,
      status: toEnum(PrismaFilePromotionStatus, file.status),
      promotionAttempts: file.promotionAttempts,
      mimeType: file.mimeType,
      size: file.size,
      checksum: file.checksum,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };

    await this.prisma.uploadFile.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }

  async delete(file: UploadFile): Promise<void> {
    await this.prisma.uploadFile.delete({ where: { id: file.id.toString() } });
  }

  private toDomain(model: PrismaUploadFile): UploadFile {
    return new UploadFile({
      id: UploadFileId.from(model.id),
      tempPath: model.tempPath,
      finalPath: model.finalPath,
      status: toEnum(FilePromotionStatus, model.status),
      promotionAttempts: model.promotionAttempts,
      mimeType: model.mimeType,
      size: model.size,
      checksum: model.checksum,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      deletedAt: null,
    });
  }
}
