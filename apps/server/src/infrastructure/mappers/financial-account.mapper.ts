import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {toEnum} from '@domain/@shared/utils';
import {ClinicId} from '@domain/clinic/entities';
import {FinancialAccount, FinancialAccountId, FinancialAccountType} from '@domain/financial-account/entities';
import {MapperWithoutDto} from '@infrastructure/mappers/mapper';

export type FinancialAccountModel = PrismaClient.FinancialAccount;

@Injectable()
export class FinancialAccountMapper extends MapperWithoutDto<FinancialAccount, FinancialAccountModel> {
    toDomain(model: FinancialAccountModel): FinancialAccount {
        return new FinancialAccount({
            id: FinancialAccountId.from(model.id),
            clinicId: ClinicId.from(model.clinicId),
            name: model.name,
            type: toEnum(FinancialAccountType, model.type),
            active: model.active,
            isDefault: model.isDefault,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: model.deletedAt ?? null,
        });
    }

    toPersistence(entity: FinancialAccount): FinancialAccountModel {
        return {
            id: entity.id.toString(),
            clinicId: entity.clinicId.toString(),
            name: entity.name,
            type: entity.type,
            active: entity.active,
            isDefault: entity.isDefault,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt ?? null,
        };
    }
}
