import { Injectable } from "@nestjs/common";
import * as PrismaClient from "@prisma/client";
import { toEnum, toEnumOrNull, toEnumArray } from "@domain/@shared/utils";
import { ClinicId } from "@domain/clinic/entities";
import { ClinicMemberId } from "@domain/clinic-member/entities";
import { PatientId } from "@domain/patient/entities";
import { ProfessionalId } from "@domain/professional/entities";
import { AppointmentId } from "@domain/appointment/entities";
import { File, FileId } from "@domain/record/entities/file.entity";
import {
  Record,
  RecordId,
  EvolutionTemplateType,
  AttendanceType,
  ClinicalStatusTag,
  ConductTag,
  RecordSource,
} from "@domain/record/entities/record.entity";
import { ImportedDocumentId } from "@domain/record/entities/imported-document.entity";
import { MapperWithoutDto } from "@infrastructure/mappers/mapper";

export type RecordModel = PrismaClient.Record & {
  files?: PrismaClient.File[];
};

@Injectable()
export class RecordMapper extends MapperWithoutDto<Record, RecordModel> {
  toDomain(model: RecordModel): Record {
    return new Record({
      ...model,
      id: RecordId.from(model.id),
      clinicId: ClinicId.from(model.clinicId),
      patientId: PatientId.from(model.patientId),
      createdByMemberId: ClinicMemberId.from(model.createdByMemberId),
      responsibleProfessionalId: ProfessionalId.from(model.responsibleProfessionalId),
      description: model.description ?? null,
      templateType: toEnumOrNull(EvolutionTemplateType, model.templateType),
      title: model.title ?? null,
      attendanceType: toEnumOrNull(AttendanceType, model.attendanceType),
      clinicalStatus: toEnumOrNull(ClinicalStatusTag, model.clinicalStatus),
      conductTags: toEnumArray(ConductTag, model.conductTags ?? []),
      subjective: model.subjective ?? null,
      objective: model.objective ?? null,
      assessment: model.assessment ?? null,
      plan: model.plan ?? null,
      freeNotes: model.freeNotes ?? null,
      eventDate: model.eventDate ?? null,
      appointmentId: model.appointmentId ? AppointmentId.from(model.appointmentId) : null,
      source: model.source ? toEnum(RecordSource, model.source) : RecordSource.MANUAL,
      importedDocumentId: model.importedDocumentId
        ? ImportedDocumentId.from(model.importedDocumentId)
        : null,
      wasHumanEdited: model.wasHumanEdited ?? false,
      isLocked: model.isLocked ?? false,
      signedAt: model.signedAt ?? null,
      signedByMemberId: model.signedByMemberId ? ClinicMemberId.from(model.signedByMemberId) : null,
      files:
        model.files?.map(
          (file) =>
            new File({
              ...file,
              id: FileId.from(file.id),
              clinicId: ClinicId.from(file.clinicId),
              createdByMemberId: ClinicMemberId.from(file.createdByMemberId),
              recordId: file.recordId ? RecordId.from(file.recordId) : null,
              patientId: file.patientId ? PatientId.from(file.patientId) : null,
              deletedAt: file.deletedAt ?? null,
            }),
        ) ?? [],
    });
  }

  toPersistence(entity: Record): RecordModel {
    return {
      id: entity.id.toString(),
      clinicId: entity.clinicId.toString(),
      patientId: entity.patientId.toString(),
      createdByMemberId: entity.createdByMemberId.toString(),
      responsibleProfessionalId: entity.responsibleProfessionalId.toString(),
      description: entity.description,
      templateType: toEnumOrNull(PrismaClient.EvolutionTemplateType, entity.templateType),
      title: entity.title,
      attendanceType: toEnumOrNull(PrismaClient.AttendanceType, entity.attendanceType),
      clinicalStatus: toEnumOrNull(PrismaClient.ClinicalStatusTag, entity.clinicalStatus),
      conductTags: toEnumArray(PrismaClient.ConductTag, entity.conductTags ?? []),
      subjective: entity.subjective,
      objective: entity.objective,
      assessment: entity.assessment,
      plan: entity.plan,
      freeNotes: entity.freeNotes,
      eventDate: entity.eventDate,
      appointmentId: entity.appointmentId?.toString() ?? null,
      source: toEnum(PrismaClient.RecordSource, entity.source),
      importedDocumentId: entity.importedDocumentId?.toString() ?? null,
      wasHumanEdited: entity.wasHumanEdited,
      isLocked: entity.isLocked,
      signedAt: entity.signedAt ?? null,
      signedByMemberId: entity.signedByMemberId?.toString() ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? null,
      patientFormId: entity.patientFormId,
      files: entity.files.map((file) => ({
        id: file.id.toString(),
        clinicId: file.clinicId.toString(),
        createdByMemberId: file.createdByMemberId.toString(),
        recordId: file.recordId?.toString() ?? null,
        patientId: file.patientId?.toString() ?? null,
        fileName: file.fileName,
        url: file.url,
        description: file.description,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
        deletedAt: file.deletedAt ?? null,
      })),
    };
  }
}
