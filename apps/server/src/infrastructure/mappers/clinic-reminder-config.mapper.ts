import { Injectable } from "@nestjs/common";
import * as PrismaClient from "@prisma/client";
import {
  ClinicReminderConfig,
  ClinicReminderConfigId,
} from "@domain/clinic-reminder-config/entities";
import { ReminderChannel } from "@domain/appointment-reminder/entities";
import { ClinicId } from "@domain/clinic/entities";
import { toEnumArray } from "@domain/@shared/utils";
import { MapperWithoutDto } from "@infrastructure/mappers/mapper";

export type ClinicReminderConfigModel = PrismaClient.ClinicReminderConfig;

@Injectable()
export class ClinicReminderConfigMapper extends MapperWithoutDto<
  ClinicReminderConfig,
  ClinicReminderConfigModel
> {
  toDomain(model: ClinicReminderConfigModel): ClinicReminderConfig {
    return new ClinicReminderConfig({
      id: ClinicReminderConfigId.from(model.id),
      clinicId: ClinicId.from(model.clinicId),
      enabledChannels: toEnumArray(ReminderChannel, model.enabledChannels),
      hoursBeforeList: model.hoursBeforeList,
      isActive: model.isActive,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      deletedAt: null,
    });
  }

  toPersistence(entity: ClinicReminderConfig): ClinicReminderConfigModel {
    return {
      id: entity.id.toString(),
      clinicId: entity.clinicId.toString(),
      enabledChannels: toEnumArray(PrismaClient.ReminderChannel, entity.enabledChannels),
      hoursBeforeList: entity.hoursBeforeList,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
