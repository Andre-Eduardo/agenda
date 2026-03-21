import {DocumentId, Phone} from '@domain/@shared/value-objects';
import {Injectable} from '@nestjs/common';
import PrismaClient, {Prisma} from '@prisma/client';
import {ProfessionalDto} from '../../application/professional/dtos/professional.dto';
import {Gender, PersonType, PersonProfile} from '../../domain/person/entities';
import {Professional, ProfessionalConfigId, ProfessionalId} from '../../domain/professional/entities';
import {UserId} from '../../domain/user/entities/user.entity';
import {MapperWithDto} from './mapper';

const ProfessionalWithPerson = Prisma.validator<Prisma.ProfessionalDefaultArgs>()({
    include: {
        person: true,
    },
});

export type ProfessionalReadModel = Prisma.ProfessionalGetPayload<typeof ProfessionalWithPerson>;
export type ProfessionalWriteModel = PrismaClient.Professional;

@Injectable()
export class ProfessionalMapper extends MapperWithDto<
    Professional,
    ProfessionalReadModel,
    ProfessionalDto,
    ProfessionalWriteModel
> {
    toDomain(model: ProfessionalReadModel): Professional {
        return new Professional({
            ...model,
            id: ProfessionalId.from(model.id),
            documentId: DocumentId.create(model.person.documentId),
            name: model.person.name,
            phone: model.person.phone ? Phone.create(model.person.phone) : null,
            gender: model.person.gender as Gender | null,
            personType: model.person.personType as unknown as PersonType,
            profiles: new Set([PersonProfile.PROFESSIONAL]),
            deletedAt: model.deletedAt ?? null,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            configId: ProfessionalConfigId.from(model.configId),
            userId: model.userId ? UserId.from(model.userId) : null,
            specialty: model.specialty ?? '',
        });
    }

    toPersistence(entity: Professional): ProfessionalWriteModel {
        return {
            id: entity.id.toString(),
            personId: entity.id.toString(),
            configId: entity.configId.toString(),
            userId: entity.userId?.toString() ?? '',
            specialty: entity.specialty,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt ?? null,
        };
    }

    toDto(entity: Professional): ProfessionalDto {
        return new ProfessionalDto(entity);
    }
}
