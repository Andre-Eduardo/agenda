import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {DocumentId, Phone} from '../../domain/@shared/value-objects';
import {Person, PersonId, PersonProfile, PersonType, Gender} from '../../domain/person/entities';
import {MapperWithoutDto} from './mapper';

export type PersonModel = PrismaClient.Person;

@Injectable()
export class PersonMapper extends MapperWithoutDto<PersonModel, Person> {
    toDomain(model: PersonModel): Person {
        return new Person({
            ...model,
            id: PersonId.from(model.id),
            documentId: DocumentId.create(model.documentId),
            name: model.name,
            companyName: model.companyName,
            gender: model.gender === null ? null : Gender[model.gender as keyof typeof Gender],
            phone: model.phone === null ? null : Phone.create(model.phone),
            profiles: new Set(model.profiles.map((profile: string) => PersonProfile[profile as keyof typeof PersonProfile])),
            personType: PersonType[model.personType as keyof typeof PersonType],
        });
    }

    toPersistence(entity: Person): PersonModel {
        return {
            id: entity.id.toString(),
            name: entity.name,
            documentId: entity.documentId.toString(),
            phone: entity.phone?.toString() ?? null,
            gender: entity.gender ?? null,
            personType: entity.personType,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            companyId: entity.companyId.toString(),
            companyName: entity.companyName ?? null,
            profiles: Array.from(entity.profiles).map((p) => p), 
        } as unknown as PersonModel;
    }
}
