import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {Appointment, AppointmentId, AppointmentStatus, AppointmentType} from '../../domain/appointment/entities';
import {PatientId} from '../../domain/patient/entities';
import {ProfessionalId} from '../../domain/professional/entities';
import {MapperWithoutDto} from './mapper';

export type AppointmentModel = PrismaClient.Appointment;

@Injectable()
export class AppointmentMapper extends MapperWithoutDto<Appointment, AppointmentModel> {
    toDomain(model: AppointmentModel): Appointment {
        return new Appointment({
            ...model,
            id: AppointmentId.from(model.id),
            patientId: PatientId.from(model.patientId),
            professionalId: ProfessionalId.from(model.professionalId),
            startAt: model.startAt,
            endAt: model.endAt,
            durationMinutes: model.durationMinutes,
            type: model.type as AppointmentType,
            canceledAt: model.canceledAt ?? null,
            canceledReason: model.canceledReason ?? null,
            note: model.note ?? null,
            status: model.status as AppointmentStatus,
        });
    }

    toPersistence(entity: Appointment): AppointmentModel {
        return {
            id: entity.id.toString(),
            patientId: entity.patientId.toString(),
            professionalId: entity.professionalId.toString(),
            startAt: entity.startAt,
            endAt: entity.endAt,
            durationMinutes: entity.durationMinutes,
            type: entity.type,
            status: entity.status,
            canceledAt: entity.canceledAt,
            canceledReason: entity.canceledReason,
            note: entity.note,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt ?? null,
        };
    }
}
