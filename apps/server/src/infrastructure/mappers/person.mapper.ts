import { Injectable } from "@nestjs/common";
import * as PrismaClient from "@prisma/client";
import { Phone } from "@domain/@shared/value-objects";
import { toEnum, toEnumOrNull } from "@domain/@shared/utils";
import { Person, PersonId, Gender, PersonType } from "@domain/person/entities";
import { MapperWithoutDto } from "@infrastructure/mappers/mapper";

export type PersonModel = PrismaClient.Person;

@Injectable()
export class PersonMapper extends MapperWithoutDto<Person, PersonModel> {
  toDomain(model: PersonModel): Person {
    return new Person({
      ...model,
      id: PersonId.from(model.id),
      documentId: null,
      name: model.name,
      gender: toEnumOrNull(Gender, model.gender),
      phone: model.phone === null ? null : Phone.create(model.phone),
      personType: toEnum(PersonType, model.personType),
      deletedAt: model.deletedAt ?? null,
    });
  }

  toPersistence(entity: Person): PersonModel {
    return {
      id: entity.id.toString(),
      name: entity.name,
      phone: entity.phone?.toString() ?? null,
      gender: toEnumOrNull(PrismaClient.Gender, entity.gender),
      personType: toEnum(PrismaClient.PersonType, entity.personType),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt ?? null,
    };
  }
}
