import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {toEnumOrNull} from '@domain/@shared/utils';
import {AppointmentType} from '@domain/appointment/entities';
import {ClinicId} from '@domain/clinic/entities';
import {PackagePlan, PackagePlanId} from '@domain/package-plan/entities';
import {MapperWithoutDto} from '@infrastructure/mappers/mapper';

export type PackagePlanModel = PrismaClient.PackagePlan;

@Injectable()
export class PackagePlanMapper extends MapperWithoutDto<PackagePlan, PackagePlanModel> {
    toDomain(model: PackagePlanModel): PackagePlan {
        return new PackagePlan({
            id: PackagePlanId.from(model.id),
            clinicId: ClinicId.from(model.clinicId),
            name: model.name,
            description: model.description ?? null,
            totalCredits: model.totalCredits,
            priceBrl: model.priceBrl,
            validityDays: model.validityDays ?? null,
            appointmentType: toEnumOrNull(AppointmentType, model.appointmentType),
            isActive: model.isActive,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: model.deletedAt ?? null,
        });
    }

    toPersistence(entity: PackagePlan): PackagePlanModel {
        return {
            id: entity.id.toString(),
            clinicId: entity.clinicId.toString(),
            name: entity.name,
            description: entity.description,
            totalCredits: entity.totalCredits,
            priceBrl: entity.priceBrl,
            validityDays: entity.validityDays,
            appointmentType: entity.appointmentType,
            isActive: entity.isActive,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt ?? null,
        };
    }
}
