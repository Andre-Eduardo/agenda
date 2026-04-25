import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {ClinicId} from '../../domain/clinic/entities';
import {InsurancePlan, InsurancePlanId} from '../../domain/insurance-plan/entities';
import {MapperWithoutDto} from './mapper';

export type InsurancePlanModel = PrismaClient.InsurancePlan;

@Injectable()
export class InsurancePlanMapper extends MapperWithoutDto<InsurancePlan, InsurancePlanModel> {
    toDomain(model: InsurancePlanModel): InsurancePlan {
        return new InsurancePlan({
            id: InsurancePlanId.from(model.id),
            clinicId: ClinicId.from(model.clinicId),
            name: model.name,
            code: model.code ?? null,
            isActive: model.isActive,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: model.deletedAt ?? null,
        });
    }

    toPersistence(entity: InsurancePlan): InsurancePlanModel {
        return {
            id: entity.id.toString(),
            clinicId: entity.clinicId.toString(),
            name: entity.name,
            code: entity.code ?? null,
            isActive: entity.isActive,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt ?? null,
        };
    }
}
