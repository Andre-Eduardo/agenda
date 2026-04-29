import { Injectable } from "@nestjs/common";
import * as PrismaClient from "@prisma/client";
import { toEnum } from "@domain/@shared/utils";
import { ClinicId } from "@domain/clinic/entities";
import { ClinicMemberId } from "@domain/clinic-member/entities";
import { PatientForm, PatientFormId, FormResponseStatus } from "@domain/patient-form/entities";
import { PatientId } from "@domain/patient/entities";
import { ProfessionalId } from "@domain/professional/entities";
import { FormTemplateId } from "@domain/form-template/entities";
import { FormTemplateVersionId } from "@domain/form-template-version/entities";
import { MapperWithoutDto } from "@infrastructure/mappers/mapper";
import type { FormResponseJson, FormComputedJson } from "@domain/form-template/types";

export type PatientFormModel = PrismaClient.PatientForm;

@Injectable()
export class PatientFormMapper extends MapperWithoutDto<PatientForm, PatientFormModel> {
  toDomain(model: PatientFormModel): PatientForm {
    return new PatientForm({
      id: PatientFormId.from(model.id),
      clinicId: ClinicId.from(model.clinicId),
      patientId: PatientId.from(model.patientId),
      createdByMemberId: ClinicMemberId.from(model.createdByMemberId),
      responsibleProfessionalId: model.responsibleProfessionalId
        ? ProfessionalId.from(model.responsibleProfessionalId)
        : null,
      templateId: FormTemplateId.from(model.templateId),
      versionId: FormTemplateVersionId.from(model.versionId),
      status: toEnum(FormResponseStatus, model.status),
      responseJson: model.responseJson as unknown as FormResponseJson,
      computedJson: model.computedJson ? (model.computedJson as unknown as FormComputedJson) : null,
      appliedAt: model.appliedAt,
      completedAt: model.completedAt ?? null,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      deletedAt: null,
    });
  }

  toPersistence(entity: PatientForm): PatientFormModel {
    return {
      id: entity.id.toString(),
      clinicId: entity.clinicId.toString(),
      patientId: entity.patientId.toString(),
      createdByMemberId: entity.createdByMemberId.toString(),
      responsibleProfessionalId: entity.responsibleProfessionalId?.toString() ?? null,
      templateId: entity.templateId.toString(),
      versionId: entity.versionId.toString(),
      status: toEnum(PrismaClient.FormResponseStatus, entity.status),
      responseJson: entity.responseJson as unknown as PrismaClient.Prisma.JsonValue,
      computedJson: entity.computedJson
        ? (entity.computedJson as unknown as PrismaClient.Prisma.JsonValue)
        : null,
      appliedAt: entity.appliedAt,
      completedAt: entity.completedAt ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
