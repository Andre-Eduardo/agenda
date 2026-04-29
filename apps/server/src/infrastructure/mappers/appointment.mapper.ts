import { Injectable } from "@nestjs/common";
import * as PrismaClient from "@prisma/client";
import {
  Appointment,
  AppointmentId,
  AppointmentStatus,
  AppointmentType,
} from "@domain/appointment/entities";
import { ClinicId } from "@domain/clinic/entities";
import { ClinicMemberId } from "@domain/clinic-member/entities";
import { PatientId } from "@domain/patient/entities";
import { MapperWithoutDto } from "@infrastructure/mappers/mapper";

export type AppointmentModel = PrismaClient.Appointment;

@Injectable()
export class AppointmentMapper extends MapperWithoutDto<Appointment, AppointmentModel> {
  toDomain(model: AppointmentModel): Appointment {
    return new Appointment({
      ...model,
      id: AppointmentId.from(model.id),
      clinicId: ClinicId.from(model.clinicId),
      patientId: PatientId.from(model.patientId),
      attendedByMemberId: ClinicMemberId.from(model.attendedByMemberId),
      createdByMemberId: ClinicMemberId.from(model.createdByMemberId),
      startAt: model.startAt,
      endAt: model.endAt,
      durationMinutes: model.durationMinutes,
      type: model.type as AppointmentType,
      canceledAt: model.canceledAt ?? null,
      canceledReason: model.canceledReason ?? null,
      note: model.note ?? null,
      status: model.status as AppointmentStatus,
      arrivedAt: model.arrivedAt ?? null,
      calledAt: model.calledAt ?? null,
    });
  }

  toPersistence(entity: Appointment): AppointmentModel {
    return {
      id: entity.id.toString(),
      clinicId: entity.clinicId.toString(),
      patientId: entity.patientId.toString(),
      attendedByMemberId: entity.attendedByMemberId.toString(),
      createdByMemberId: entity.createdByMemberId.toString(),
      startAt: entity.startAt,
      endAt: entity.endAt,
      durationMinutes: entity.durationMinutes,
      type: entity.type,
      status: entity.status,
      canceledAt: entity.canceledAt,
      canceledReason: entity.canceledReason,
      note: entity.note,
      arrivedAt: entity.arrivedAt,
      calledAt: entity.calledAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? null,
    };
  }
}
