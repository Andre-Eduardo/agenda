import { Injectable } from "@nestjs/common";
import * as PrismaClient from "@prisma/client";
import { toEnumOrNull } from "@domain/@shared/utils";
import { FormFieldIndex, FormFieldIndexId } from "@domain/form-field-index/entities";
import { PatientFormId } from "@domain/patient-form/entities";
import { AiSpecialtyGroup } from "@domain/form-template/entities";
import { MapperWithoutDto } from "@infrastructure/mappers/mapper";

export type FormFieldIndexModel = PrismaClient.FormFieldIndex;

@Injectable()
export class FormFieldIndexMapper extends MapperWithoutDto<FormFieldIndex, FormFieldIndexModel> {
  toDomain(model: FormFieldIndexModel): FormFieldIndex {
    return new FormFieldIndex({
      id: FormFieldIndexId.from(model.id),
      patientFormId: PatientFormId.from(model.patientFormId),
      fieldId: model.fieldId,
      fieldLabel: model.fieldLabel ?? null,
      fieldType: model.fieldType ?? null,
      valueText: model.valueText ?? null,
      valueNumber: model.valueNumber ?? null,
      valueBoolean: model.valueBoolean ?? null,
      valueDate: model.valueDate ?? null,
      valueJson: model.valueJson ?? null,
      specialtyGroup: toEnumOrNull(AiSpecialtyGroup, model.specialtyGroup),
      confidence: model.confidence ?? null,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  toPersistence(entity: FormFieldIndex): FormFieldIndexModel {
    return {
      id: entity.id.toString(),
      patientFormId: entity.patientFormId.toString(),
      fieldId: entity.fieldId,
      fieldLabel: entity.fieldLabel,
      fieldType: entity.fieldType,
      valueText: entity.valueText,
      valueNumber: entity.valueNumber,
      valueBoolean: entity.valueBoolean,
      valueDate: entity.valueDate ?? null,
      valueJson: entity.valueJson ? (entity.valueJson as PrismaClient.Prisma.JsonValue) : null,
      specialtyGroup: entity.specialtyGroup
        ? toEnumOrNull(PrismaClient.AiSpecialtyGroup, entity.specialtyGroup)
        : null,
      confidence: entity.confidence,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
