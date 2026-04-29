import { Injectable } from "@nestjs/common";
import * as PrismaClient from "@prisma/client";
import { ClinicId } from "@domain/clinic/entities";
import { ClinicMemberId } from "@domain/clinic-member/entities";
import { WorkingHours, WorkingHoursId } from "@domain/professional/entities";
import { MapperWithoutDto } from "@infrastructure/mappers/mapper";

export type WorkingHoursModel = PrismaClient.WorkingHours;

@Injectable()
export class WorkingHoursMapper extends MapperWithoutDto<WorkingHours, WorkingHoursModel> {
  toDomain(model: WorkingHoursModel): WorkingHours {
    return new WorkingHours({
      id: WorkingHoursId.from(model.id),
      clinicId: ClinicId.from(model.clinicId),
      clinicMemberId: ClinicMemberId.from(model.clinicMemberId),
      dayOfWeek: model.dayOfWeek,
      startTime: model.startTime,
      endTime: model.endTime,
      slotDuration: model.slotDuration,
      active: model.active,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      deletedAt: model.deletedAt ?? null,
    });
  }

  toPersistence(entity: WorkingHours): WorkingHoursModel {
    return {
      id: entity.id.toString(),
      clinicId: entity.clinicId.toString(),
      clinicMemberId: entity.clinicMemberId.toString(),
      dayOfWeek: entity.dayOfWeek,
      startTime: entity.startTime,
      endTime: entity.endTime,
      slotDuration: entity.slotDuration,
      active: entity.active,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? null,
    };
  }
}
