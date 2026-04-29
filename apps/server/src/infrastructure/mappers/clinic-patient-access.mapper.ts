import { Injectable } from "@nestjs/common";
import * as PrismaClient from "@prisma/client";
import { toEnum } from "@domain/@shared/utils";
import { ClinicId } from "@domain/clinic/entities";
import { ClinicMemberId } from "@domain/clinic-member/entities";
import {
  ClinicPatientAccess,
  ClinicPatientAccessId,
  PatientAccessLevel,
} from "@domain/clinic-patient-access/entities";
import { PatientId } from "@domain/patient/entities";
import { MapperWithoutDto } from "@infrastructure/mappers/mapper";

export type ClinicPatientAccessModel = PrismaClient.ClinicPatientAccess;

@Injectable()
export class ClinicPatientAccessMapper extends MapperWithoutDto<
  ClinicPatientAccess,
  ClinicPatientAccessModel
> {
  toDomain(model: ClinicPatientAccessModel): ClinicPatientAccess {
    return new ClinicPatientAccess({
      id: ClinicPatientAccessId.from(model.id),
      clinicId: ClinicId.from(model.clinicId),
      memberId: ClinicMemberId.from(model.memberId),
      patientId: PatientId.from(model.patientId),
      accessLevel: toEnum(PatientAccessLevel, model.accessLevel),
      reason: model.reason,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      deletedAt: model.deletedAt ?? null,
    });
  }

  toPersistence(entity: ClinicPatientAccess): ClinicPatientAccessModel {
    return {
      id: entity.id.toString(),
      clinicId: entity.clinicId.toString(),
      memberId: entity.memberId.toString(),
      patientId: entity.patientId.toString(),
      accessLevel: toEnum(PrismaClient.PatientAccessLevel, entity.accessLevel),
      reason: entity.reason,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? null,
    };
  }
}
