import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {DocumentId, Phone} from '../../domain/@shared/value-objects';
import {Person, PersonId, Gender} from '../../domain/person/entities';
import {MapperWithoutDto} from './mapper';

export type PersonModel = PrismaClient.Person;

@Injectable()
export class PersonMapper extends MapperWithoutDto<Person, PersonModel> {
    toDomain(model: PersonModel): Person {
        return new Person({
            ...model,
            id: PersonId.from(model.id),
            documentId: DocumentId.create(model.documentId),
            name: model.name,
            gender: model.gender === null ? null : Gender[model.gender as keyof typeof Gender],
            phone: model.phone === null ? null : Phone.create(model.phone),
        });
    }

    toPersistence(entity: Person): PersonModel {
        return {
            id: entity.id.toString(),
            name: entity.name,
            documentId: entity.documentId.toString(),
            phone: entity.phone?.toString() ?? null,
            gender: entity.gender ?? null,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        } as unknown as PersonModel;
    }
}
