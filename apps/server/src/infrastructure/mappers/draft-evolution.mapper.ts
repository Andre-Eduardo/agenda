import { Injectable } from "@nestjs/common";
import * as PrismaClient from "@prisma/client";
import { toEnum, toEnumOrNull, toEnumArray } from "@domain/@shared/utils";
import { ClinicId } from "@domain/clinic/entities";
import { ClinicMemberId } from "@domain/clinic-member/entities";
import { PatientId } from "@domain/patient/entities";
import {
  DraftEvolution,
  DraftEvolutionId,
  DraftEvolutionStatus,
} from "@domain/draft-evolution/entities/draft-evolution.entity";
import {
  AttendanceType,
  ClinicalStatusTag,
  ConductTag,
  EvolutionTemplateType,
  RecordId,
} from "@domain/record/entities/record.entity";
import { ImportedDocumentId } from "@domain/record/entities/imported-document.entity";
import { MapperWithoutDto } from "@infrastructure/mappers/mapper";

export type DraftEvolutionModel = PrismaClient.DraftEvolution;

@Injectable()
export class DraftEvolutionMapper extends MapperWithoutDto<DraftEvolution, DraftEvolutionModel> {
  toDomain(model: DraftEvolutionModel): DraftEvolution {
    return new DraftEvolution({
      ...model,
      id: DraftEvolutionId.from(model.id),
      clinicId: ClinicId.from(model.clinicId),
      patientId: PatientId.from(model.patientId),
      createdByMemberId: ClinicMemberId.from(model.createdByMemberId),
      importedDocumentId: model.importedDocumentId
        ? ImportedDocumentId.from(model.importedDocumentId)
        : null,
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
      overallConfidence: model.overallConfidence ?? null,
      status: toEnum(DraftEvolutionStatus, model.status),
      wasHumanEdited: model.wasHumanEdited ?? false,
      reviewRequired: model.reviewRequired ?? true,
      approvedByMemberId: model.approvedByMemberId
        ? ClinicMemberId.from(model.approvedByMemberId)
        : null,
      approvedAt: model.approvedAt ?? null,
      recordId: model.recordId ? RecordId.from(model.recordId) : null,
    });
  }

  toPersistence(entity: DraftEvolution): DraftEvolutionModel {
    return {
      id: entity.id.toString(),
      clinicId: entity.clinicId.toString(),
      patientId: entity.patientId.toString(),
      createdByMemberId: entity.createdByMemberId.toString(),
      importedDocumentId: entity.importedDocumentId?.toString() ?? null,
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
      overallConfidence: entity.overallConfidence,
      status: toEnum(PrismaClient.DraftEvolutionStatus, entity.status),
      wasHumanEdited: entity.wasHumanEdited,
      reviewRequired: entity.reviewRequired,
      approvedByMemberId: entity.approvedByMemberId?.toString() ?? null,
      approvedAt: entity.approvedAt ?? null,
      recordId: entity.recordId?.toString() ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
