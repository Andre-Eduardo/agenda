import { Injectable } from "@nestjs/common";
import * as PrismaClient from "@prisma/client";
import { ClinicId } from "@domain/clinic/entities";
import { ClinicMemberId } from "@domain/clinic-member/entities";
import {
  RecordAmendment,
  RecordAmendmentId,
} from "@domain/record/entities/record-amendment.entity";
import { RecordId } from "@domain/record/entities/record.entity";
import { MapperWithoutDto } from "@infrastructure/mappers/mapper";

export type RecordAmendmentModel = PrismaClient.RecordAmendment;

@Injectable()
export class RecordAmendmentMapper extends MapperWithoutDto<RecordAmendment, RecordAmendmentModel> {
  toDomain(model: RecordAmendmentModel): RecordAmendment {
    return new RecordAmendment({
      ...model,
      id: RecordAmendmentId.from(model.id),
      clinicId: ClinicId.from(model.clinicId),
      recordId: RecordId.from(model.recordId),
      requestedByMemberId: ClinicMemberId.from(model.requestedByMemberId),
      relockedAt: model.relockedAt ?? null,
    });
  }

  toPersistence(entity: RecordAmendment): RecordAmendmentModel {
    return {
      id: entity.id.toString(),
      clinicId: entity.clinicId.toString(),
      recordId: entity.recordId.toString(),
      requestedByMemberId: entity.requestedByMemberId.toString(),
      justification: entity.justification,
      reopenedAt: entity.reopenedAt,
      relockedAt: entity.relockedAt ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
