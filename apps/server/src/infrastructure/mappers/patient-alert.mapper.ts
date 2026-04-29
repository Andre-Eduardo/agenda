import { Injectable } from "@nestjs/common";
import * as PrismaClient from "@prisma/client";
import { toEnum } from "@domain/@shared/utils";
import { ClinicId } from "@domain/clinic/entities";
import { ClinicMemberId } from "@domain/clinic-member/entities";
import { PatientId } from "@domain/patient/entities";
import { PatientAlert, PatientAlertId, AlertSeverity } from "@domain/patient-alert/entities";
import { MapperWithoutDto } from "@infrastructure/mappers/mapper";

export type PatientAlertModel = PrismaClient.PatientAlert;

@Injectable()
export class PatientAlertMapper extends MapperWithoutDto<PatientAlert, PatientAlertModel> {
  toDomain(model: PatientAlertModel): PatientAlert {
    return new PatientAlert({
      ...model,
      id: PatientAlertId.from(model.id),
      clinicId: ClinicId.from(model.clinicId),
      patientId: PatientId.from(model.patientId),
      createdByMemberId: ClinicMemberId.from(model.createdByMemberId),
      description: model.description ?? null,
      severity: toEnum(AlertSeverity, model.severity),
      isActive: model.isActive,
      deletedAt: model.deletedAt ?? null,
    });
  }

  toPersistence(entity: PatientAlert): PatientAlertModel {
    return {
      id: entity.id.toString(),
      clinicId: entity.clinicId.toString(),
      patientId: entity.patientId.toString(),
      createdByMemberId: entity.createdByMemberId.toString(),
      title: entity.title,
      description: entity.description,
      severity: toEnum(PrismaClient.AlertSeverity, entity.severity),
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? null,
    };
  }
}
