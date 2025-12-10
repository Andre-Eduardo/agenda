import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {ProfessionalDto} from '../../application/professional/dtos/professional.dto';
import {PersonId} from '../../domain/person/entities';
import {Professional, ProfessionalId} from '../../domain/professional/entities';
import {UserId} from '../../domain/user/entities/user.entity';
import {MapperWithDto} from './mapper';

export type ProfessionalModel = PrismaClient.Professional;

@Injectable()
export class ProfessionalMapper extends MapperWithDto<ProfessionalModel, Professional, ProfessionalDto> {
    toDomain(model: ProfessionalModel): Professional {
        return new Professional({
            ...model,
            id: ProfessionalId.from(model.id),
            personId: PersonId.from(model.id), // Since professional.id is FK to Person, it is also the PersonId
            userId: model.userId ? UserId.from(model.userId) : null,
            allowSystemAccess: model.allowSystemAccess,
            specialty: model.specialty ?? null,
        });
    }

    toPersistence(entity: Professional): ProfessionalModel {
        return {
            id: entity.id.toString(),
            // personId is same as id
            userId: entity.userId?.toString() ?? null,
            allowSystemAccess: entity.allowSystemAccess,
            specialty: entity.specialty,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }

    toDto(entity: Professional): ProfessionalDto {
        return {
            id: entity.id.toString(),
            specialty: entity.specialty,
            allowSystemAccess: entity.allowSystemAccess,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
