import { Injectable } from "@nestjs/common";
import * as PrismaClient from "@prisma/client";
import { toEnum } from "@domain/@shared/utils";
import { ClinicId } from "@domain/clinic/entities";
import { ClinicMemberId } from "@domain/clinic-member/entities";
import { PatientId } from "@domain/patient/entities";
import { FileId } from "@domain/record/entities/file.entity";
import {
  ImportedDocument,
  ImportedDocumentId,
  ImportStatus,
} from "@domain/record/entities/imported-document.entity";
import { MapperWithoutDto } from "@infrastructure/mappers/mapper";

export type ImportedDocumentModel = PrismaClient.ImportedDocument;

@Injectable()
export class ImportedDocumentMapper extends MapperWithoutDto<
  ImportedDocument,
  ImportedDocumentModel
> {
  toDomain(model: ImportedDocumentModel): ImportedDocument {
    return new ImportedDocument({
      ...model,
      id: ImportedDocumentId.from(model.id),
      clinicId: ClinicId.from(model.clinicId),
      patientId: PatientId.from(model.patientId),
      createdByMemberId: ClinicMemberId.from(model.createdByMemberId),
      fileId: FileId.from(model.fileId),
      documentType: model.documentType ?? null,
      qualityLabel: model.qualityLabel ?? null,
      qualityScore: model.qualityScore ?? null,
      rawOcrText: model.rawOcrText ?? null,
      normalizedOcrText: model.normalizedOcrText ?? null,
      ocrConfidence: model.ocrConfidence ?? null,
      aiConfidence: model.aiConfidence ?? null,
      status: toEnum(ImportStatus, model.status),
      reviewRequired: model.reviewRequired,
    });
  }

  toPersistence(entity: ImportedDocument): ImportedDocumentModel {
    return {
      id: entity.id.toString(),
      clinicId: entity.clinicId.toString(),
      patientId: entity.patientId.toString(),
      createdByMemberId: entity.createdByMemberId.toString(),
      fileId: entity.fileId.toString(),
      documentType: entity.documentType,
      qualityLabel: entity.qualityLabel,
      qualityScore: entity.qualityScore,
      rawOcrText: entity.rawOcrText,
      normalizedOcrText: entity.normalizedOcrText,
      ocrConfidence: entity.ocrConfidence,
      aiConfidence: entity.aiConfidence,
      status: toEnum(PrismaClient.ImportStatus, entity.status),
      reviewRequired: entity.reviewRequired,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
