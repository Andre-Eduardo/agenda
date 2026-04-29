import { Injectable } from "@nestjs/common";
import * as PrismaClient from "@prisma/client";
import { toEnum } from "@domain/@shared/utils";
import { ClinicId } from "@domain/clinic/entities";
import { ClinicMemberId } from "@domain/clinic-member/entities";
import { ProfessionalId } from "@domain/professional/entities";
import { PatientId } from "@domain/patient/entities";
import { AppointmentId } from "@domain/appointment/entities";
import {
  ClinicalDocument,
  ClinicalDocumentId,
  ClinicalDocumentType,
  ClinicalDocumentStatus,
  type ClinicalDocumentContent,
} from "@domain/clinical-document/entities/clinical-document.entity";
import { ClinicalDocumentTemplateId } from "@domain/clinical-document/entities/clinical-document-template.entity";
import { MapperWithoutDto } from "@infrastructure/mappers/mapper";

export type ClinicalDocumentModel = PrismaClient.ClinicalDocument;

@Injectable()
export class ClinicalDocumentMapper extends MapperWithoutDto<
  ClinicalDocument,
  ClinicalDocumentModel
> {
  toDomain(model: ClinicalDocumentModel): ClinicalDocument {
    return new ClinicalDocument({
      id: ClinicalDocumentId.from(model.id),
      clinicId: ClinicId.from(model.clinicId),
      patientId: PatientId.from(model.patientId),
      createdByMemberId: ClinicMemberId.from(model.createdByMemberId),
      responsibleProfessionalId: ProfessionalId.from(model.responsibleProfessionalId),
      type: toEnum(ClinicalDocumentType, model.type),
      templateId: model.templateId ? ClinicalDocumentTemplateId.from(model.templateId) : null,
      contentJson: model.contentJson as ClinicalDocumentContent,
      fileId: model.fileId ?? null,
      generatedAt: model.generatedAt ?? null,
      status: toEnum(ClinicalDocumentStatus, model.status),
      appointmentId: model.appointmentId ? AppointmentId.from(model.appointmentId) : null,
      recordId: model.recordId ?? null,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      deletedAt: model.deletedAt ?? null,
    });
  }

  toPersistence(entity: ClinicalDocument): ClinicalDocumentModel {
    return {
      id: entity.id.toString(),
      clinicId: entity.clinicId.toString(),
      patientId: entity.patientId.toString(),
      createdByMemberId: entity.createdByMemberId.toString(),
      responsibleProfessionalId: entity.responsibleProfessionalId.toString(),
      type: toEnum(PrismaClient.ClinicalDocumentType, entity.type),
      templateId: entity.templateId?.toString() ?? null,
      contentJson: entity.contentJson as PrismaClient.Prisma.JsonValue,
      fileId: entity.fileId ?? null,
      generatedAt: entity.generatedAt ?? null,
      status: toEnum(PrismaClient.ClinicalDocumentStatus, entity.status),
      appointmentId: entity.appointmentId?.toString() ?? null,
      recordId: entity.recordId ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? null,
    };
  }
}
