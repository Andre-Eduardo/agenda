import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {ProfessionalDto} from '../../application/professional/dtos/professional.dto';
import {PersonId} from '../../domain/person/entities';
import {Professional, ProfessionalConfigId, ProfessionalId} from '../../domain/professional/entities';
import {UserId} from '../../domain/user/entities/user.entity';
import {MapperWithDto} from './mapper';

export type ProfessionalModel = PrismaClient.Professional;

@Injectable()
export class ProfessionalMapper extends MapperWithDto<Professional, ProfessionalModel, ProfessionalDto> {
    toDomain(model: ProfessionalModel): Professional {
        return new Professional({
            ...model,
            id: ProfessionalId.from(model.id),
            personId: PersonId.from(model.personId),
            configId: ProfessionalConfigId.from(model.configId),
            userId: model.userId ? UserId.from(model.userId) : null,
            specialty: model.specialty ?? '',
        });
    }

    toPersistence(entity: Professional): ProfessionalModel {
        return {
            id: entity.id.toString(),
            personId: entity.personId.toString(),
            configId: entity.configId.toString(),
            userId: entity.userId?.toString() ?? '',
            specialty: entity.specialty,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }

    toDto(entity: Professional): ProfessionalDto {
        return {
            id: entity.id.toString(),
            specialty: entity.specialty,
            configId: entity.configId.toString(),
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
