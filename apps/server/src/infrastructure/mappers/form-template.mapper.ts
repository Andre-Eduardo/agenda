import { Injectable } from "@nestjs/common";
import * as PrismaClient from "@prisma/client";
import { toEnumOrNull } from "@domain/@shared/utils";
import { ClinicId } from "@domain/clinic/entities";
import { ClinicMemberId } from "@domain/clinic-member/entities";
import { AiSpecialtyGroup, FormTemplate, FormTemplateId } from "@domain/form-template/entities";
import { MapperWithoutDto } from "@infrastructure/mappers/mapper";

export type FormTemplateModel = PrismaClient.FormTemplate;

@Injectable()
export class FormTemplateMapper extends MapperWithoutDto<FormTemplate, FormTemplateModel> {
  toDomain(model: FormTemplateModel): FormTemplate {
    return new FormTemplate({
      id: FormTemplateId.from(model.id),
      code: model.code,
      name: model.name,
      description: model.description ?? null,
      specialtyGroup: toEnumOrNull(AiSpecialtyGroup, model.specialtyGroup),
      specialtyLabel: model.specialtyLabel ?? null,
      isPublic: model.isPublic,
      clinicId: model.clinicId ? ClinicId.from(model.clinicId) : null,
      createdByMemberId: model.createdByMemberId
        ? ClinicMemberId.from(model.createdByMemberId)
        : null,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      deletedAt: model.deletedAt ?? null,
    });
  }

  toPersistence(entity: FormTemplate): FormTemplateModel {
    return {
      id: entity.id.toString(),
      code: entity.code,
      name: entity.name,
      description: entity.description,
      specialtyGroup: entity.specialtyGroup
        ? toEnumOrNull(PrismaClient.AiSpecialtyGroup, entity.specialtyGroup)
        : null,
      specialtyLabel: entity.specialtyLabel,
      isPublic: entity.isPublic,
      clinicId: entity.clinicId?.toString() ?? null,
      createdByMemberId: entity.createdByMemberId?.toString() ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? null,
    };
  }
}
