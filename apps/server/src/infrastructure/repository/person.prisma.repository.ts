import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {Person, PersonId} from '../../domain/person/entities';
import {PersonRepository} from '../../domain/person/person.repository';
import {PersonMapper} from '../mappers/person.mapper';
import {PrismaProvider} from './prisma/prisma.provider';
import {PrismaRepository} from './prisma.repository';

export type PersonModel = PrismaClient.Person;

@Injectable()
export class PersonPrismaRepository extends PrismaRepository implements PersonRepository {
    constructor(
        readonly prismaProvider: PrismaProvider,
        private readonly mapper: PersonMapper
    ) {
        super(prismaProvider);
    }

    async findById(id: PersonId): Promise<Person | null> {
        const person = await this.prisma.person.findUnique({
            where: {
                id: id.toString(),
            },
        });

        return person === null ? null : this.mapper.toDomain(person);
    }

    async delete(id: PersonId): Promise<void> {
        await this.prisma.person.delete({
            where: {
                id: id.toString(),
            },
        });
    }
}
