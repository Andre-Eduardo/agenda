import {Injectable} from '@nestjs/common';
import * as PrismaClient from '@prisma/client';
import {Person, PersonId} from '../../domain/person/entities';
import {PersonRepository, PersonSearchFilter, PersonSortOptions} from '../../domain/person/person.repository';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
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

    async search(
        pagination: Pagination<PersonSortOptions>,
        filter: PersonSearchFilter = {}
    ): Promise<PaginatedList<Person>> {
        const where: PrismaClient.Prisma.PersonWhereInput = {
            id: filter.ids ? {in: filter.ids.map((id) => id.toString())} : undefined,
            name: filter.name ? {contains: filter.name, mode: 'insensitive'} : undefined,
            phone: filter.phone ? {contains: filter.phone.toString()} : undefined,
            gender: filter.gender ? filter.gender : undefined,
        };

        const [data, totalCount] = await Promise.all([
            this.prisma.person.findMany({
                where,
                ...this.normalizePagination(pagination, {createdAt: 'desc'}),
            }),
            this.prisma.person.count({where}),
        ]);

        return {
            data: data.map((item) => this.mapper.toDomain(item)),
            totalCount,
        };
    }

    async save(person: Person): Promise<void> {
        const data = this.mapper.toPersistence(person);

        await this.prisma.person.upsert({
            where: {id: data.id},
            create: data,
            update: data,
        });
    }
}
