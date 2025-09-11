import {Prisma} from '@prisma/client';
import {mockDeep} from 'jest-mock-extended';
import type {Pagination} from '../../../domain/@shared/repository';
import {DocumentId, Phone} from '../../../domain/@shared/value-objects';
import {CompanyId} from '../../../domain/company/entities';
import type {CustomerSearchFilter, CustomerSortOptions} from '../../../domain/customer/customer.repository';
import type {Customer} from '../../../domain/customer/entities';
import {fakeCustomer} from '../../../domain/customer/entities/__tests__/fake-customer';
import {Gender, PersonProfile, PersonType} from '../../../domain/person/entities';
import {DuplicateDocumentIdException} from '../../../domain/person/person.exceptions';
import type {CustomerModel} from '../index';
import {CustomerPrismaRepository} from '../index';
import {type PrismaService, UNIQUE_CONSTRAINT_VIOLATION} from '../prisma';

describe('A customer repository backed by Prisma ORM', () => {
    const prisma = mockDeep<PrismaService>();
    const repository = new CustomerPrismaRepository(prisma);
    const companyId = CompanyId.generate();
    const domainCustomers: Customer[] = [
        fakeCustomer({
            name: 'My name 1',
            companyId,
            personType: PersonType.NATURAL,
            gender: undefined,
        }),
        fakeCustomer({
            name: 'My name 2',
            documentId: DocumentId.create('12345678923'),
            companyId,
            companyName: null,
            phone: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        }),
        fakeCustomer({
            name: 'My name 3',
            documentId: DocumentId.create('12345678999'),
            companyId,
            personType: PersonType.NATURAL,
            phone: Phone.create('12345678911'),
            gender: Gender.MALE,
            createdAt: new Date(),
            updatedAt: new Date(),
        }),
    ];

    const databaseCustomers: CustomerModel[] = [
        {
            id: domainCustomers[0].id.toString(),
            createdAt: domainCustomers[0].createdAt,
            updatedAt: domainCustomers[0].updatedAt,
            person: {
                id: domainCustomers[0].id.toString(),
                name: domainCustomers[0].name,
                documentId: domainCustomers[0].documentId.toString(),
                companyId: domainCustomers[0].companyId.toString(),
                companyName: domainCustomers[0].companyName ?? null,
                phone: domainCustomers[0].phone === null ? null : domainCustomers[0].phone.toString(),
                personType: domainCustomers[0].personType,
                profiles: Array.from(domainCustomers[0]?.profiles),
                gender: domainCustomers[0].gender ?? null,
                createdAt: domainCustomers[0].createdAt,
                updatedAt: domainCustomers[0].updatedAt,
            },
        },
        {
            id: domainCustomers[1].id.toString(),
            createdAt: domainCustomers[1].createdAt,
            updatedAt: domainCustomers[1].updatedAt,
            person: {
                id: domainCustomers[1].id.toString(),
                name: domainCustomers[1].name,
                documentId: domainCustomers[1].documentId.toString(),
                companyId: domainCustomers[1].companyId.toString(),
                companyName: domainCustomers[1].companyName ?? null,
                phone: domainCustomers[1].phone === null ? null : domainCustomers[1].phone.toString(),
                personType: domainCustomers[1].personType,
                profiles: Array.from(domainCustomers[1]?.profiles),
                gender: domainCustomers[1].gender ?? null,
                createdAt: domainCustomers[1].createdAt,
                updatedAt: domainCustomers[1].updatedAt,
            },
        },
        {
            id: domainCustomers[2].id.toString(),
            createdAt: domainCustomers[2].createdAt,
            updatedAt: domainCustomers[2].updatedAt,
            person: {
                id: domainCustomers[2].id.toString(),
                name: domainCustomers[2].name,
                documentId: domainCustomers[2].documentId.toString(),
                companyId: domainCustomers[2].companyId.toString(),
                phone: domainCustomers[2].phone === null ? null : domainCustomers[2].phone.toString(),
                companyName: domainCustomers[2].companyName ?? null,
                personType: domainCustomers[2].personType,
                profiles: Array.from(domainCustomers[2]?.profiles),
                gender: domainCustomers[2].gender ?? null,
                createdAt: domainCustomers[2].createdAt,
                updatedAt: domainCustomers[2].updatedAt,
            },
        },
    ];

    it.each([
        [null, null],
        [databaseCustomers[0], domainCustomers[0]],
    ])('should find a customer by ID', async (databaseCustomer, domainCustomer) => {
        jest.spyOn(prisma.customer, 'findUnique').mockResolvedValueOnce(databaseCustomer);

        const result = await repository.findById(domainCustomers[0].id);

        expect(result).toEqual(domainCustomer);
        expect(prisma.customer.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.customer.findUnique).toHaveBeenCalledWith({
            where: {
                id: domainCustomers[0].id.toString(),
            },
            include: {
                person: true,
            },
        });
    });

    it('should save a customer', async () => {
        const {id, person, ...customerModel} = databaseCustomers[2];

        jest.spyOn(prisma.person, 'upsert');

        await repository.save(domainCustomers[2]);

        expect(prisma.person.upsert).toHaveBeenCalledTimes(1);
        expect(prisma.person.upsert).toHaveBeenCalledWith({
            where: {
                id,
            },
            create: {
                ...person,
                customer: {
                    connectOrCreate: {
                        where: {
                            id,
                        },
                        create: {
                            ...customerModel,
                        },
                    },
                },
            },
            update: {
                ...person,
                customer: {
                    connectOrCreate: {
                        where: {
                            id,
                        },
                        create: {
                            ...customerModel,
                        },
                    },
                    update: customerModel,
                },
            },
        });
    });

    it('should throw an exception when saving a customer with duplicate document ID', async () => {
        jest.spyOn(prisma.person, 'upsert').mockRejectedValueOnce(
            new Prisma.PrismaClientKnownRequestError('Unique constraint violation', {
                clientVersion: '0.0.0',
                code: UNIQUE_CONSTRAINT_VIOLATION,
                meta: {
                    target: ['document_id'],
                },
            })
        );
        await expect(repository.save(domainCustomers[1])).rejects.toThrowWithMessage(
            DuplicateDocumentIdException,
            'Duplicate person document ID.'
        );
    });

    it('should rethrow an unknown error when saving a customer', async () => {
        jest.spyOn(prisma.person, 'upsert').mockRejectedValue(new Error('Generic error'));
        await expect(repository.save(domainCustomers[1])).rejects.toThrowWithMessage(Error, 'Generic error');
    });

    it('should delete a customer by ID', async () => {
        jest.spyOn(prisma.customer, 'delete');

        await repository.delete(domainCustomers[0].id);

        expect(prisma.customer.delete).toHaveBeenCalledTimes(1);
        expect(prisma.customer.delete).toHaveBeenCalledWith({
            where: {
                id: domainCustomers[0].id.toString(),
            },
        });
    });

    it('should search customers', async () => {
        const pagination: Pagination<CustomerSortOptions> = {
            limit: 5,
            sort: {
                createdAt: 'desc',
                name: 'asc',
            },
        };

        const filter: CustomerSearchFilter = {
            name: 'My name',
            documentId: DocumentId.create('12345678901'),
            gender: Gender.MALE,
            profiles: [PersonProfile.CUSTOMER],
            companyName: 'company',
            personType: PersonType.LEGAL,
        };

        jest.spyOn(prisma.customer, 'findMany').mockResolvedValueOnce(databaseCustomers);
        jest.spyOn(prisma.customer, 'count').mockResolvedValueOnce(databaseCustomers.length);

        await expect(repository.search(companyId, pagination, filter)).resolves.toEqual({
            data: domainCustomers,
            totalCount: databaseCustomers.length,
            nextCursor: null,
        });

        expect(prisma.customer.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.customer.findMany).toHaveBeenCalledWith({
            where: {
                person: {
                    name: {contains: filter.name, mode: 'insensitive'},
                    companyName: {
                        mode: 'insensitive',
                        contains: filter.companyName,
                    },
                    phone: {contains: undefined},
                    documentId: {contains: filter.documentId?.toString()},
                    companyId: companyId.toString(),
                    gender: 'MALE',
                    personType: 'LEGAL',
                    profiles: {hasSome: ['CUSTOMER']},
                },
            },
            take: 6,
            include: {
                person: true,
            },
            orderBy: [
                {
                    createdAt: 'desc',
                },
                {
                    updatedAt: undefined,
                },
                {
                    person: {
                        name: 'asc',
                    },
                },
                {
                    id: 'asc',
                },
            ],
        });

        expect(prisma.customer.count).toHaveBeenCalledTimes(1);
        expect(prisma.customer.count).toHaveBeenCalledWith({
            where: {
                person: {
                    name: {contains: filter.name, mode: 'insensitive'},
                    companyName: {
                        mode: 'insensitive',
                        contains: filter.companyName,
                    },
                    phone: {contains: undefined},
                    documentId: {contains: filter.documentId?.toString()},
                    companyId: companyId.toString(),
                    gender: 'MALE',
                    personType: 'LEGAL',
                    profiles: {hasSome: ['CUSTOMER']},
                },
            },
        });
    });

    it('should paginate customers', async () => {
        const pagination: Pagination<CustomerSortOptions> = {
            limit: 1,
            sort: {},
        };

        jest.spyOn(prisma.customer, 'findMany').mockResolvedValueOnce(databaseCustomers.slice(0, pagination.limit + 1));
        jest.spyOn(prisma.customer, 'count').mockResolvedValueOnce(databaseCustomers.length);

        const result = await repository.search(companyId, pagination);

        expect(result).toEqual({
            data: [domainCustomers[0]],
            totalCount: databaseCustomers.length,
            nextCursor: databaseCustomers[1].id,
        });

        expect(prisma.customer.findMany).toHaveBeenCalledWith({
            where: {
                person: {
                    name: {contains: undefined, mode: 'insensitive'},
                    companyName: {
                        mode: 'insensitive',
                        contains: undefined,
                    },
                    phone: {contains: undefined},
                    documentId: {contains: undefined},
                    companyId: companyId.toString(),
                    gender: undefined,
                    personType: undefined,
                    profiles: undefined,
                },
            },
            take: 2,
            include: {
                person: true,
            },
            orderBy: [
                {
                    createdAt: undefined,
                },
                {
                    updatedAt: undefined,
                },
                {
                    id: 'asc',
                },
            ],
        });

        jest.spyOn(prisma.customer, 'findMany').mockResolvedValueOnce(databaseCustomers.slice(1, pagination.limit + 2));
        jest.spyOn(prisma.customer, 'count').mockResolvedValueOnce(databaseCustomers.length);

        await expect(
            repository.search(companyId, {
                ...pagination,
                cursor: result.nextCursor!,
            })
        ).resolves.toEqual({
            data: [domainCustomers[1]],
            totalCount: databaseCustomers.length,
            nextCursor: databaseCustomers[2].id,
        });

        expect(prisma.customer.findMany).toHaveBeenCalledWith({
            where: {
                person: {
                    name: {contains: undefined, mode: 'insensitive'},
                    companyName: {
                        mode: 'insensitive',
                        contains: undefined,
                    },
                    phone: {contains: undefined},
                    documentId: {contains: undefined},
                    companyId: companyId.toString(),
                    gender: undefined,
                    personType: undefined,
                    profiles: undefined,
                },
            },
            take: 2,
            include: {
                person: true,
            },
            orderBy: [
                {
                    createdAt: undefined,
                },
                {
                    updatedAt: undefined,
                },
                {
                    id: 'asc',
                },
            ],
        });
    });
});
