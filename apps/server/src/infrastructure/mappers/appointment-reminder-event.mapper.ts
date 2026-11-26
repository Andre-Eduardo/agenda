import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {toEnum} from '@domain/@shared/utils';
import {
    AppointmentReminderEvent,
    AppointmentReminderEventId,
    AppointmentReminderId,
    ReminderEventSource,
    ReminderEventType,
} from '@domain/appointment-reminder/entities';
import {ClinicId} from '@domain/clinic/entities';
import {MapperWithoutDto} from '@infrastructure/mappers/mapper';

export type AppointmentReminderEventModel = PrismaClient.AppointmentReminderEvent;

@Injectable()
export class AppointmentReminderEventMapper extends MapperWithoutDto<
    AppointmentReminderEvent,
    AppointmentReminderEventModel
> {
    toDomain(model: AppointmentReminderEventModel): AppointmentReminderEvent {
        return new AppointmentReminderEvent({
            id: AppointmentReminderEventId.from(model.id),
            clinicId: ClinicId.from(model.clinicId),
            reminderId: AppointmentReminderId.from(model.reminderId),
            type: toEnum(ReminderEventType, model.type),
            source: toEnum(ReminderEventSource, model.source),
            externalId: model.externalId ?? null,
            attempt: model.attempt ?? null,
            detail: model.detail ?? null,
            occurredAt: model.occurredAt,
            createdAt: model.createdAt,
            // Events are append-only, so they are never updated after creation.
            updatedAt: model.createdAt,
            deletedAt: null,
        });
    }

    toPersistence(entity: AppointmentReminderEvent): AppointmentReminderEventModel {
        return {
            id: entity.id.toString(),
            clinicId: entity.clinicId.toString(),
            reminderId: entity.reminderId.toString(),
            type: toEnum(PrismaClient.ReminderEventType, entity.type),
            source: toEnum(PrismaClient.ReminderEventSource, entity.source),
            externalId: entity.externalId,
            attempt: entity.attempt,
            detail: entity.detail,
            occurredAt: entity.occurredAt,
            createdAt: entity.createdAt,
        };
    }
}
