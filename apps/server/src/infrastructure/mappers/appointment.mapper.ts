import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {toEnum} from '@domain/@shared/utils';
import {Appointment, AppointmentId, AppointmentStatus, AppointmentType} from '@domain/appointment/entities';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {PatientId} from '@domain/patient/entities';
import {ProcedureColor, ProcedureModality} from '@domain/procedure/procedure.entity';
import {RecordId} from '@domain/record/entities';
import {RoomId} from '@domain/room/entities';
import {MapperWithoutDto} from '@infrastructure/mappers/mapper';

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
            procedure:
                model.procedureId !== null &&
                model.procedureName !== null &&
                model.procedureColor !== null &&
                model.procedurePriceInCents !== null &&
                model.procedureModality !== null
                    ? {
                          id: model.procedureId,
                          name: model.procedureName,
                          color: toEnum(ProcedureColor, model.procedureColor),
                          priceInCents: model.procedurePriceInCents,
                          modality: toEnum(ProcedureModality, model.procedureModality),
                      }
                    : null,
            type: toEnum(AppointmentType, model.type),
            canceledAt: model.canceledAt ?? null,
            canceledReason: model.canceledReason ?? null,
            note: model.note ?? null,
            status: toEnum(AppointmentStatus, model.status),
            arrivedAt: model.arrivedAt ?? null,
            calledAt: model.calledAt ?? null,
            roomId: model.roomId === null ? null : RoomId.from(model.roomId),
            followUpFromRecordId:
                model.followUpFromRecordId === null ? null : RecordId.from(model.followUpFromRecordId),
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
            procedureId: entity.procedure?.id ?? null,
            procedureName: entity.procedure?.name ?? null,
            procedureColor: entity.procedure?.color ?? null,
            procedurePriceInCents: entity.procedure?.priceInCents ?? null,
            procedureModality: entity.procedure?.modality ?? null,
            type: entity.type,
            status: entity.status,
            canceledAt: entity.canceledAt,
            canceledReason: entity.canceledReason,
            note: entity.note,
            arrivedAt: entity.arrivedAt,
            calledAt: entity.calledAt,
            roomId: entity.roomId?.toString() ?? null,
            followUpFromRecordId: entity.followUpFromRecordId?.toString() ?? null,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt ?? null,
        };
    }
}
