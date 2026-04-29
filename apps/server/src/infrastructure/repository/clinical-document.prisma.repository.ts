import { Injectable } from "@nestjs/common";
import * as PrismaClient from "@prisma/client";
import { Prisma } from "@prisma/client";
import { toEnumOrNull } from "@domain/@shared/utils";
import { ClinicalDocument, ClinicalDocumentId } from "@domain/clinical-document/entities";
import {
  ClinicalDocumentRepository,
  ClinicalDocumentSearchFilter,
  ClinicalDocumentSortOptions,
  GeneratedFileData,
} from "@domain/clinical-document/clinical-document.repository";
import { PaginatedList, Pagination } from "@domain/@shared/repository";
import { ClinicalDocumentMapper } from "@infrastructure/mappers/clinical-document.mapper";
import { PrismaProvider } from "@infrastructure/repository/prisma/prisma.provider";
import { PrismaRepository } from "@infrastructure/repository/prisma.repository";

@Injectable()
export class ClinicalDocumentPrismaRepository
  extends PrismaRepository
  implements ClinicalDocumentRepository
{
  constructor(
    readonly prismaProvider: PrismaProvider,
    private readonly mapper: ClinicalDocumentMapper,
  ) {
    super(prismaProvider);
  }

  async findById(id: ClinicalDocumentId): Promise<ClinicalDocument | null> {
    const model = await this.prisma.clinicalDocument.findUnique({
      where: { id: id.toString() },
    });

    return model ? this.mapper.toDomain(model) : null;
  }

  async search(
    pagination: Pagination<ClinicalDocumentSortOptions>,
    filter: ClinicalDocumentSearchFilter = {},
  ): Promise<PaginatedList<ClinicalDocument>> {
    const where: PrismaClient.Prisma.ClinicalDocumentWhereInput = {
      clinicId: filter.clinicId ? filter.clinicId.toString() : undefined,
      patientId: filter.patientId ? filter.patientId.toString() : undefined,
      type: toEnumOrNull(PrismaClient.ClinicalDocumentType, filter.type) ?? undefined,
      status: toEnumOrNull(PrismaClient.ClinicalDocumentStatus, filter.status) ?? undefined,
      deletedAt: null,
    };

    const [data, totalCount] = await Promise.all([
      this.prisma.clinicalDocument.findMany({
        where,
        ...this.normalizePagination(pagination, { createdAt: "desc" }),
      }),
      this.prisma.clinicalDocument.count({ where }),
    ]);

    return {
      data: data.map((m) => this.mapper.toDomain(m)),
      totalCount,
    };
  }

  async save(document: ClinicalDocument): Promise<void> {
    const data = this.mapper.toPersistence(document);
    const writeData: Prisma.ClinicalDocumentUncheckedCreateInput = {
      ...data,
      contentJson: data.contentJson as Prisma.InputJsonValue,
    };

    await this.prisma.clinicalDocument.upsert({
      where: { id: data.id },
      create: writeData,
      update: writeData,
    });
  }

  async saveWithGeneratedFile(
    document: ClinicalDocument,
    fileData: GeneratedFileData,
  ): Promise<string> {
    const { fileId } = document;

    if (fileId === null) {
      throw new Error(
        "Cannot save: document.fileId is null. Call markGenerated() before saveWithGeneratedFile().",
      );
    }

    const raw = this.mapper.toPersistence(document);
    const documentData: Prisma.ClinicalDocumentUncheckedCreateInput = {
      ...raw,
      contentJson: raw.contentJson as Prisma.InputJsonValue,
    };
    const now = new Date();

    await this.prismaProvider.runAtomically(async () => {
      await this.prisma.file.create({
        data: {
          id: fileId,
          clinicId: fileData.clinicId.toString(),
          createdByMemberId: fileData.createdByMemberId.toString(),
          patientId: fileData.patientId.toString(),
          fileName: fileData.fileName,
          url: fileData.url,
          description: fileData.description,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.prisma.clinicalDocument.upsert({
        where: { id: documentData.id },
        create: documentData,
        update: documentData,
      });
    });

    return fileId;
  }
}
