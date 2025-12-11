import { Injectable } from '@nestjs/common';
import { ProfessionalDto } from '../../application/professional/dtos/professional.dto';
import { Gender, PersonId, PersonType } from '../../domain/person/entities';
import { Professional, ProfessionalConfigId, ProfessionalId } from '../../domain/professional/entities';
import { UserId } from '../../domain/user/entities/user.entity';
import { MapperWithDto } from './mapper';
import { DocumentId, Phone } from '@domain/@shared/value-objects';
import PrismaClient, { Prisma } from '@prisma/client';

const ProfessionalWithPerson = Prisma.validator<Prisma.ProfessionalDefaultArgs>()(
    {
        include: {
            person: true,
        },
    }
);
export type ProfessionalReadModel = Prisma.ProfessionalGetPayload<typeof ProfessionalWithPerson>;
export type ProfessionalWriteModel = PrismaClient.Professional;

@Injectable()
export class ProfessionalMapper extends MapperWithDto<Professional, ProfessionalReadModel, ProfessionalDto, ProfessionalWriteModel> {
    toDomain(model: ProfessionalReadModel): Professional {
        return new Professional({
            ...model,
            id: ProfessionalId.from(model.id),
            documentId: DocumentId.create(model.person.documentId),
            name: model.person.name,
            phone: model.person.phone ? Phone.create(model.person.phone) : null,
            gender: model.person.gender as Gender | null,
            personType: PersonType.PROFESSIONAL,
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
