import {Prisma} from '@prisma/client';
import {mockDeep} from 'jest-mock-extended';
import type {Pagination} from '../../../domain/@shared/repository';
import {DocumentId, Phone} from '../../../domain/@shared/value-objects';
import {CompanyId} from '../../../domain/company/entities';
import {Gender, PersonId, PersonProfile, PersonType} from '../../../domain/person/entities';
import {DuplicateDocumentIdException} from '../../../domain/person/person.exceptions';
import type {Supplier} from '../../../domain/supplier/entities';
import {fakeSupplier} from '../../../domain/supplier/entities/__tests__/fake-supplier';
import type {SupplierSearchFilter, SupplierSortOptions} from '../../../domain/supplier/supplier.repository';
import type {SupplierModel} from '../index';
import {SupplierPrismaRepository} from '../index';
import {type PrismaService, UNIQUE_CONSTRAINT_VIOLATION} from '../prisma';

describe('A supplier repository backed by Prisma ORM', () => {
    const prisma = mockDeep<PrismaService>();
    const repository = new SupplierPrismaRepository(prisma);
    const companyId = CompanyId.generate();
    const domainSuppliers: Supplier[] = [
        fakeSupplier({
            id: PersonId.generate(),
            name: 'My name 1',
            personType: PersonType.NATURAL,
            documentId: DocumentId.create('12345678901'),
            gender: undefined,
        }),
        fakeSupplier({
            id: PersonId.generate(),
            name: 'My name 2',
            documentId: DocumentId.create('12345678923'),
            profiles: new Set([PersonProfile.SUPPLIER]),
            companyName: null,
            personType: PersonType.LEGAL,
            companyId,
            phone: null,
        }),
        fakeSupplier({
            id: PersonId.generate(),
            name: 'My name 3',
            phone: Phone.create('12345678911'),
            profiles: new Set([PersonProfile.SUPPLIER]),
            personType: PersonType.NATURAL,
            gender: Gender.MALE,
            companyId,
        }),
    ];

    const databaseSuppliers: SupplierModel[] = [
        {
            id: domainSuppliers[0].id.toString(),
            createdAt: domainSuppliers[0].createdAt,
            updatedAt: domainSuppliers[0].updatedAt,
            person: {
                id: domainSuppliers[0].id.toString(),
                name: domainSuppliers[0].name,
                documentId: domainSuppliers[0].documentId.toString(),
                companyId: domainSuppliers[0].companyId.toString(),
                companyName: domainSuppliers[0].companyName ?? null,
                phone: domainSuppliers[0].phone === null ? null : domainSuppliers[0].phone.toString(),
                personType: domainSuppliers[0].personType,
                profiles: Array.from(domainSuppliers[0]?.profiles),
                gender: domainSuppliers[0].gender ?? null,
                createdAt: domainSuppliers[0].createdAt,
                updatedAt: domainSuppliers[0].updatedAt,
            },
        },
        {
            id: domainSuppliers[1].id.toString(),
            createdAt: domainSuppliers[1].createdAt,
            updatedAt: domainSuppliers[1].updatedAt,
            person: {
                id: domainSuppliers[1].id.toString(),
                name: domainSuppliers[1].name,
                documentId: domainSuppliers[1].documentId.toString(),
                companyId: domainSuppliers[1].companyId.toString(),
                companyName: domainSuppliers[1].companyName ?? null,
                phone: domainSuppliers[1].phone === null ? null : domainSuppliers[1].phone.toString(),
                personType: domainSuppliers[1].personType,
                profiles: Array.from(domainSuppliers[1]?.profiles),
                gender: domainSuppliers[1].gender ?? null,
                createdAt: domainSuppliers[1].createdAt,
                updatedAt: domainSuppliers[1].updatedAt,
            },
        },
        {
            id: domainSuppliers[2].id.toString(),
            createdAt: domainSuppliers[2].createdAt,
            updatedAt: domainSuppliers[2].updatedAt,
            person: {
                id: domainSuppliers[2].id.toString(),
                name: domainSuppliers[2].name,
                documentId: domainSuppliers[2].documentId.toString(),
                companyId: domainSuppliers[2].companyId.toString(),
                phone: domainSuppliers[2].phone === null ? null : domainSuppliers[2].phone.toString(),
                companyName: domainSuppliers[2].companyName ?? null,
                personType: domainSuppliers[2].personType,
                profiles: Array.from(domainSuppliers[2]?.profiles),
                gender: domainSuppliers[2].gender ?? null,
                createdAt: domainSuppliers[2].createdAt,
                updatedAt: domainSuppliers[2].updatedAt,
            },
        },
    ];

    it.each([
        [null, null],
        [databaseSuppliers[0], domainSuppliers[0]],
    ])('should find a supplier by ID', async (databaseSupplier, domainSupplier) => {
        jest.spyOn(prisma.supplier, 'findUnique').mockResolvedValueOnce(databaseSupplier);

        const result = await repository.findById(domainSuppliers[0].id);

        expect(result).toEqual(domainSupplier);
        expect(prisma.supplier.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.supplier.findUnique).toHaveBeenCalledWith({
            where: {
                id: domainSuppliers[0].id.toString(),
            },
            include: {
                person: true,
            },
        });
    });

    it('should save a supplier', async () => {
        const {id, person, ...supplierModel} = databaseSuppliers[2];

        jest.spyOn(prisma.person, 'upsert');

        await repository.save(domainSuppliers[2]);

        expect(prisma.person.upsert).toHaveBeenCalledTimes(1);
        expect(prisma.person.upsert).toHaveBeenCalledWith({
            where: {
                id,
            },
            create: {
                ...person,
                supplier: {
                    connectOrCreate: {
                        where: {
                            id,
                        },
                        create: {
                            ...supplierModel,
                        },
                    },
                },
            },
            update: {
                ...person,
                supplier: {
                    connectOrCreate: {
                        where: {
                            id,
                        },
                        create: {
                            ...supplierModel,
                        },
                    },
                    update: supplierModel,
                },
            },
        });
    });

    it('should throw an exception when saving a supplier with duplicate document ID', async () => {
        jest.spyOn(prisma.person, 'upsert').mockRejectedValueOnce(
            new Prisma.PrismaClientKnownRequestError('Unique constraint violation', {
                clientVersion: '0.0.0',
                code: UNIQUE_CONSTRAINT_VIOLATION,
                meta: {
                    target: ['document_id'],
                },
            })
        );
        await expect(repository.save(domainSuppliers[1])).rejects.toThrowWithMessage(
            DuplicateDocumentIdException,
            'Duplicate person document ID.'
        );
    });

    it('should rethrow an unknown error when saving a supplier', async () => {
        jest.spyOn(prisma.person, 'upsert').mockRejectedValue(new Error('Generic error'));
        await expect(repository.save(domainSuppliers[1])).rejects.toThrowWithMessage(Error, 'Generic error');
    });

    it('should delete a supplier by ID', async () => {
        jest.spyOn(prisma.supplier, 'delete');

        await repository.delete(domainSuppliers[0].id);

        expect(prisma.supplier.delete).toHaveBeenCalledTimes(1);
        expect(prisma.supplier.delete).toHaveBeenCalledWith({
            where: {
                id: domainSuppliers[0].id.toString(),
            },
        });
    });

    it('should search suppliers', async () => {
        const pagination: Pagination<SupplierSortOptions> = {
            limit: 5,
            sort: {
                createdAt: 'desc',
                name: 'asc',
            },
        };

        const filter: SupplierSearchFilter = {
            name: 'My name',
            documentId: DocumentId.create('12345678901'),
            gender: Gender.MALE,
            profiles: [PersonProfile.SUPPLIER],
            companyName: 'company',
            personType: PersonType.LEGAL,
        };

        jest.spyOn(prisma.supplier, 'findMany').mockResolvedValueOnce(databaseSuppliers);
        jest.spyOn(prisma.supplier, 'count').mockResolvedValueOnce(databaseSuppliers.length);

        await expect(repository.search(companyId, pagination, filter)).resolves.toEqual({
            data: domainSuppliers,
            totalCount: databaseSuppliers.length,
            nextCursor: null,
        });

        expect(prisma.supplier.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.supplier.findMany).toHaveBeenCalledWith({
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
                    profiles: {hasSome: ['SUPPLIER']},
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

        expect(prisma.supplier.count).toHaveBeenCalledTimes(1);
        expect(prisma.supplier.count).toHaveBeenCalledWith({
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
                    profiles: {hasSome: ['SUPPLIER']},
                },
            },
        });
    });

    it('should paginate suppliers', async () => {
        const pagination: Pagination<SupplierSortOptions> = {
            limit: 1,
            sort: {},
        };

        jest.spyOn(prisma.supplier, 'findMany').mockResolvedValueOnce(databaseSuppliers.slice(0, pagination.limit + 1));
        jest.spyOn(prisma.supplier, 'count').mockResolvedValueOnce(databaseSuppliers.length);

        const result = await repository.search(companyId, pagination);

        expect(result).toEqual({
            data: [domainSuppliers[0]],
            totalCount: databaseSuppliers.length,
            nextCursor: databaseSuppliers[1].id,
        });

        expect(prisma.supplier.findMany).toHaveBeenCalledWith({
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

        jest.spyOn(prisma.supplier, 'findMany').mockResolvedValueOnce(databaseSuppliers.slice(1, pagination.limit + 2));
        jest.spyOn(prisma.supplier, 'count').mockResolvedValueOnce(databaseSuppliers.length);

        await expect(
            repository.search(companyId, {
                ...pagination,
                cursor: result.nextCursor!,
            })
        ).resolves.toEqual({
            data: [domainSuppliers[1]],
            totalCount: databaseSuppliers.length,
            nextCursor: databaseSuppliers[2].id,
        });

        expect(prisma.supplier.findMany).toHaveBeenCalledWith({
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
