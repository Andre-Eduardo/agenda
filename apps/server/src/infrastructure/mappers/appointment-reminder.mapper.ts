import { Injectable } from "@nestjs/common";
import * as PrismaClient from "@prisma/client";
import {
  AppointmentReminder,
  AppointmentReminderId,
  ReminderChannel,
  ReminderStatus,
} from "@domain/appointment-reminder/entities";
import { AppointmentId } from "@domain/appointment/entities";
import { ClinicId } from "@domain/clinic/entities";
import { PatientId } from "@domain/patient/entities";
import { toEnum } from "@domain/@shared/utils";
import { MapperWithoutDto } from "@infrastructure/mappers/mapper";

export type AppointmentReminderModel = PrismaClient.AppointmentReminder;

@Injectable()
export class AppointmentReminderMapper extends MapperWithoutDto<
  AppointmentReminder,
  AppointmentReminderModel
> {
  toDomain(model: AppointmentReminderModel): AppointmentReminder {
    return new AppointmentReminder({
      id: AppointmentReminderId.from(model.id),
      clinicId: ClinicId.from(model.clinicId),
      appointmentId: AppointmentId.from(model.appointmentId),
      patientId: PatientId.from(model.patientId),
      channel: toEnum(ReminderChannel, model.channel),
      status: toEnum(ReminderStatus, model.status),
      scheduledAt: model.scheduledAt,
      sentAt: model.sentAt ?? null,
      failedAt: model.failedAt ?? null,
      attempts: model.attempts,
      errorMessage: model.errorMessage ?? null,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      deletedAt: null,
    });
  }

  toPersistence(entity: AppointmentReminder): AppointmentReminderModel {
    return {
      id: entity.id.toString(),
      clinicId: entity.clinicId.toString(),
      appointmentId: entity.appointmentId.toString(),
      patientId: entity.patientId.toString(),
      channel: toEnum(PrismaClient.ReminderChannel, entity.channel),
      status: toEnum(PrismaClient.ReminderStatus, entity.status),
      scheduledAt: entity.scheduledAt,
      sentAt: entity.sentAt,
      failedAt: entity.failedAt,
      attempts: entity.attempts,
      errorMessage: entity.errorMessage,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
