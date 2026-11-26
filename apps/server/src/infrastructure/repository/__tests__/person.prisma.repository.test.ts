import {mockDeep} from 'jest-mock-extended';
import type {Pagination} from '@domain/@shared/repository';
import {Phone} from '@domain/@shared/value-objects';
import {Gender, Person, PersonId, PersonType} from '@domain/person/entities';
import type {PersonSortOptions} from '@domain/person/person.repository';
import {PersonMapper} from '@infrastructure/mappers/person.mapper';
import type {PersonModel} from '@infrastructure/repository/person.prisma.repository';
import {PersonPrismaRepository} from '@infrastructure/repository/person.prisma.repository';
import {PrismaProvider} from '@infrastructure/repository/prisma/prisma.provider';
import {PrismaService} from '@infrastructure/repository/prisma/prisma.service';

describe('A person repository backed by Prisma ORM', () => {
    const prisma = mockDeep<PrismaService>();
    const prismaProvider = mockDeep<PrismaProvider>();

    Object.defineProperty(prismaProvider, 'client', {get: () => prisma});

    const repository = new PersonPrismaRepository(prismaProvider, new PersonMapper());

    const domainPersons: Person[] = [
        new Person({
            id: PersonId.generate(),
            name: 'My name 1',
            documentId: null,
            personType: PersonType.NATURAL,
            gender: null,
            phone: Phone.create('5511999999999'),
            createdAt: new Date(1000),
            updatedAt: new Date(1000),
            deletedAt: null,
        }),
        new Person({
            id: PersonId.generate(),
            name: 'My name 2',
            documentId: null,
            personType: PersonType.LEGAL,
            gender: null,
            phone: null,
            createdAt: new Date(2000),
            updatedAt: new Date(2000),
            deletedAt: null,
        }),
        new Person({
            id: PersonId.generate(),
            name: 'My name 3',
            documentId: null,
            personType: PersonType.NATURAL,
            gender: Gender.MALE,
            phone: Phone.create('5511988888888'),
            createdAt: new Date(3000),
            updatedAt: new Date(3000),
            deletedAt: null,
        }),
    ];

    const databasePersons: PersonModel[] = domainPersons.map((person) => ({
        id: person.id.toString(),
        name: person.name,
        phone: person.phone?.toString() ?? null,
        gender: person.gender,
        personType: person.personType,
        createdAt: person.createdAt,
        updatedAt: person.updatedAt,
        deletedAt: null,
    }));

    afterEach(() => {
        jest.clearAllMocks();
    });

    it.each([
        [null, null],
        [databasePersons[0], domainPersons[0]],
        [databasePersons[1], domainPersons[1]],
        [databasePersons[2], domainPersons[2]],
    ])('should find a person by ID', async (databasePerson, domainPerson) => {
        prisma.person.findUnique.mockResolvedValueOnce(databasePerson);

        const result = await repository.findById(domainPersons[0].id);

        expect(result).toEqual(domainPerson);
        expect(prisma.person.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.person.findUnique).toHaveBeenCalledWith({
            where: {
                id: domainPersons[0].id.toString(),
                deletedAt: null,
            },
        });
    });

    it('should soft-delete a person by ID', async () => {
        const now = new Date('2024-01-01T00:00:00Z');

        jest.useFakeTimers({now});

        await repository.delete(domainPersons[0].id);

        jest.useRealTimers();

        expect(prisma.person.updateMany).toHaveBeenCalledTimes(1);
        expect(prisma.person.updateMany).toHaveBeenCalledWith({
            where: {id: domainPersons[0].id.toString(), deletedAt: null},
            data: {deletedAt: now, updatedAt: now},
        });
    });

    it('should search persons', async () => {
        const pagination: Pagination<PersonSortOptions> = {
            limit: 10,
            page: 2,
            sort: [{key: 'name', direction: 'asc'}],
        };

        prisma.person.findMany.mockResolvedValueOnce(databasePersons);
        prisma.person.count.mockResolvedValueOnce(databasePersons.length);

        const result = await repository.search(pagination, {name: 'My name', gender: Gender.MALE});

        expect(result).toEqual({data: domainPersons, totalCount: databasePersons.length});

        const where = {
            id: undefined,
            name: {contains: 'My name', mode: 'insensitive'},
            phone: undefined,
            gender: Gender.MALE,
            deletedAt: null,
        };

        expect(prisma.person.findMany).toHaveBeenCalledWith({
            where,
            skip: 10,
            take: 10,
            orderBy: [{name: 'asc'}, {createdAt: 'desc'}],
        });
        expect(prisma.person.count).toHaveBeenCalledWith({where});
    });

    it('should save a person', async () => {
        await repository.save(domainPersons[0]);

        expect(prisma.person.upsert).toHaveBeenCalledWith({
            where: {id: databasePersons[0].id},
            create: databasePersons[0],
            update: databasePersons[0],
        });
    });
});
