import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {DocumentId, Phone} from '../../domain/@shared/value-objects';
import {CompanyId} from '../../domain/company/entities';
import {Gender, Person, PersonId, PersonProfile, PersonType} from '../../domain/person/entities';
import {PersonRepository} from '../../domain/person/person.repository';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';

export type PersonModel = PrismaClient.Person;

@Injectable()
export class PersonPrismaRepository extends PrismaRepository implements PersonRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    private static normalize(person: PersonModel): Person {
        return new Person({
            ...person,
            id: PersonId.from(person.id),
            companyId: CompanyId.from(person.companyId),
            documentId: DocumentId.create(person.documentId),
            name: person.name,
            companyName: person.companyName,
            gender: person.gender === null ? null : Gender[person.gender],
            phone: person.phone === null ? null : Phone.create(person.phone),
            profiles: new Set(person.profiles.map((profile) => PersonProfile[profile])),
            personType: PersonType[person.personType],
        });
    }

    async findById(id: PersonId): Promise<Person | null> {
        const person = await this.prisma.person.findUnique({
            where: {
                id: id.toString(),
            },
        });

        return person === null ? null : PersonPrismaRepository.normalize(person);
    }

    async delete(id: PersonId): Promise<void> {
        await this.prisma.person.delete({
            where: {
                id: id.toString(),
            },
        });
    }
}
