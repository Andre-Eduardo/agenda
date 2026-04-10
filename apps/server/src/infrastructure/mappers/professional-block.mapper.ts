import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {ProfessionalBlock, ProfessionalBlockId} from '../../domain/professional/entities';
import {ProfessionalId} from '../../domain/professional/entities';
import {MapperWithoutDto} from './mapper';

export type ProfessionalBlockModel = PrismaClient.ProfessionalBlock;

@Injectable()
export class ProfessionalBlockMapper extends MapperWithoutDto<ProfessionalBlock, ProfessionalBlockModel> {
    toDomain(model: ProfessionalBlockModel): ProfessionalBlock {
        return new ProfessionalBlock({
            id: ProfessionalBlockId.from(model.id),
            professionalId: ProfessionalId.from(model.professionalId),
            startAt: model.startAt,
            endAt: model.endAt,
            reason: model.reason ?? null,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            deletedAt: null,
        });
    }

    toPersistence(entity: ProfessionalBlock): ProfessionalBlockModel {
        return {
            id: entity.id.toString(),
            professionalId: entity.professionalId.toString(),
            startAt: entity.startAt,
            endAt: entity.endAt,
            reason: entity.reason,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
