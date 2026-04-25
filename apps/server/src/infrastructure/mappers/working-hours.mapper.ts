import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {ClinicMemberId} from '../../domain/clinic-member/entities';
import {WorkingHours, WorkingHoursId} from '../../domain/professional/entities';
import {MapperWithoutDto} from './mapper';

export type WorkingHoursModel = PrismaClient.WorkingHours;

@Injectable()
export class WorkingHoursMapper extends MapperWithoutDto<WorkingHours, WorkingHoursModel> {
    toDomain(model: WorkingHoursModel): WorkingHours {
        return new WorkingHours({
            id: WorkingHoursId.from(model.id),
            clinicMemberId: ClinicMemberId.from(model.clinicMemberId),
            dayOfWeek: model.dayOfWeek,
            startTime: model.startTime,
            endTime: model.endTime,
            slotDuration: model.slotDuration,
            active: model.active,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: null,
        });
    }

    toPersistence(entity: WorkingHours): WorkingHoursModel {
        return {
            id: entity.id.toString(),
            clinicMemberId: entity.clinicMemberId.toString(),
            dayOfWeek: entity.dayOfWeek,
            startTime: entity.startTime,
            endTime: entity.endTime,
            slotDuration: entity.slotDuration,
            active: entity.active,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
