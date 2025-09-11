import {Prisma} from '@prisma/client';
import {mockDeep} from 'jest-mock-extended';
import type {Pagination} from '../../../domain/@shared/repository';
import {DocumentId, Phone} from '../../../domain/@shared/value-objects';
import {CompanyId} from '../../../domain/company/entities';
import type {EmployeeSearchFilter, EmployeeSortOptions} from '../../../domain/employee/employee.repository';
import type {Employee} from '../../../domain/employee/entities';
import {fakeEmployee} from '../../../domain/employee/entities/__tests__/fake-employee';
import {Gender, PersonProfile, PersonType} from '../../../domain/person/entities';
import {DuplicateDocumentIdException} from '../../../domain/person/person.exceptions';
import type {EmployeeModel} from '../index';
import {EmployeePrismaRepository} from '../index';
import {type PrismaService, UNIQUE_CONSTRAINT_VIOLATION} from '../prisma';

describe('An employee repository backed by Prisma ORM', () => {
    const prisma = mockDeep<PrismaService>();
    const repository = new EmployeePrismaRepository(prisma);
    const companyId = CompanyId.generate();
    const domainEmployees: Employee[] = [
        fakeEmployee({
            name: 'My name 1',
            profiles: new Set([PersonProfile.EMPLOYEE]),
            personType: PersonType.NATURAL,
            documentId: DocumentId.create('12345678901'),
            gender: undefined,
            companyId,
            phone: Phone.create('12345678901'),
            allowSystemAccess: false,
            userId: null,
        }),
        fakeEmployee({
            name: 'My name 2',
            documentId: DocumentId.create('12345678923'),
            companyName: null,
            profiles: new Set([PersonProfile.EMPLOYEE]),
            personType: PersonType.LEGAL,
            companyId,
            phone: null,
            allowSystemAccess: true,
        }),
        fakeEmployee({
            name: 'My name 3',
            documentId: DocumentId.create('12345678999'),
            gender: Gender.MALE,
            profiles: new Set([PersonProfile.EMPLOYEE]),
            personType: PersonType.NATURAL,
            companyId,
            phone: Phone.create('12345678911'),
            allowSystemAccess: true,
        }),
    ];

    const databaseEmployees: EmployeeModel[] = [
        {
            id: domainEmployees[0].id.toString(),
            positionId: domainEmployees[0].positionId.toString(),
            allowSystemAccess: domainEmployees[0].allowSystemAccess,
            userId: domainEmployees[0].userId?.toString() ?? null,
            createdAt: domainEmployees[0].createdAt,
            updatedAt: domainEmployees[0].updatedAt,
            person: {
                id: domainEmployees[0].id.toString(),
                name: domainEmployees[0].name,
                documentId: domainEmployees[0].documentId.toString(),
                companyId: domainEmployees[0].companyId.toString(),
                companyName: domainEmployees[0].companyName ?? null,
                phone: domainEmployees[0].phone === null ? null : domainEmployees[0].phone.toString(),
                personType: domainEmployees[0].personType,
                profiles: Array.from(domainEmployees[0]?.profiles),
                gender: domainEmployees[0].gender ?? null,
                createdAt: domainEmployees[0].createdAt,
                updatedAt: domainEmployees[0].updatedAt,
            },
        },
        {
            id: domainEmployees[1].id.toString(),
            positionId: domainEmployees[1].positionId.toString(),
            allowSystemAccess: domainEmployees[1].allowSystemAccess,
            userId: domainEmployees[1].userId?.toString() ?? null,
            createdAt: domainEmployees[1].createdAt,
            updatedAt: domainEmployees[1].updatedAt,
            person: {
                id: domainEmployees[1].id.toString(),
                name: domainEmployees[1].name,
                documentId: domainEmployees[1].documentId.toString(),
                companyId: domainEmployees[1].companyId.toString(),
                companyName: domainEmployees[1].companyName ?? null,
                phone: domainEmployees[1].phone === null ? null : domainEmployees[1].phone.toString(),
                personType: domainEmployees[1].personType,
                profiles: Array.from(domainEmployees[1]?.profiles),
                gender: domainEmployees[1].gender ?? null,
                createdAt: domainEmployees[1].createdAt,
                updatedAt: domainEmployees[1].updatedAt,
            },
        },
        {
            id: domainEmployees[2].id.toString(),
            positionId: domainEmployees[2].positionId.toString(),
            allowSystemAccess: domainEmployees[2].allowSystemAccess,
            userId: domainEmployees[2].userId?.toString() ?? null,
            createdAt: domainEmployees[2].createdAt,
            updatedAt: domainEmployees[2].updatedAt,
            person: {
                id: domainEmployees[2].id.toString(),
                name: domainEmployees[2].name,
                documentId: domainEmployees[2].documentId.toString(),
                companyId: domainEmployees[2].companyId.toString(),
                phone: domainEmployees[2].phone === null ? null : domainEmployees[2].phone.toString(),
                companyName: domainEmployees[2].companyName ?? null,
                personType: domainEmployees[2].personType,
                profiles: Array.from(domainEmployees[2]?.profiles),
                gender: domainEmployees[2].gender ?? null,
                createdAt: domainEmployees[2].createdAt,
                updatedAt: domainEmployees[2].updatedAt,
            },
        },
    ];

    it.each([
        [null, null],
        [databaseEmployees[0], domainEmployees[0]],
    ])('should find an employee by ID', async (databaseEmployee, domainEmployee) => {
        jest.spyOn(prisma.employee, 'findUnique').mockResolvedValueOnce(databaseEmployee);

        const result = await repository.findById(domainEmployees[0].id);

        expect(result).toEqual(domainEmployee);
        expect(prisma.employee.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.employee.findUnique).toHaveBeenCalledWith({
            where: {
                id: domainEmployees[0].id.toString(),
            },
            include: {
                person: true,
            },
        });
    });

    it.each([
        [databaseEmployees[0], domainEmployees[0]],
        [databaseEmployees[1], domainEmployees[1]],
    ])('should save an employee', async (databaseEmployee, domainEmployee) => {
        const {id, person, ...employeeModel} = databaseEmployee;

        jest.spyOn(prisma.person, 'upsert');

        await repository.save(domainEmployee);

        expect(prisma.person.upsert).toHaveBeenCalledTimes(1);
        expect(prisma.person.upsert).toHaveBeenCalledWith({
            where: {
                id,
            },
            create: {
                ...person,
                employee: {
                    connectOrCreate: {
                        where: {
                            id,
                        },
                        create: {
                            ...employeeModel,
                        },
                    },
                },
            },
            update: {
                ...person,
                employee: {
                    connectOrCreate: {
                        where: {
                            id,
                        },
                        create: {
                            ...employeeModel,
                        },
                    },
                    update: employeeModel,
                },
            },
        });
    });

    it('should throw an exception when saving an employee with duplicate document ID', async () => {
        jest.spyOn(prisma.person, 'upsert').mockRejectedValueOnce(
            new Prisma.PrismaClientKnownRequestError('Unique constraint violation', {
                clientVersion: '0.0.0',
                code: UNIQUE_CONSTRAINT_VIOLATION,
                meta: {
                    target: ['document_id'],
                },
            })
        );
        await expect(repository.save(domainEmployees[1])).rejects.toThrowWithMessage(
            DuplicateDocumentIdException,
            'Duplicate person document ID.'
        );
    });

    it('should rethrow an unknown error when saving an employee', async () => {
        jest.spyOn(prisma.person, 'upsert').mockRejectedValue(new Error('Generic error'));
        await expect(repository.save(domainEmployees[1])).rejects.toThrowWithMessage(Error, 'Generic error');
    });

    it('should delete an employee by ID', async () => {
        jest.spyOn(prisma.employee, 'delete');

        await repository.delete(domainEmployees[0].id);

        expect(prisma.employee.delete).toHaveBeenCalledTimes(1);
        expect(prisma.employee.delete).toHaveBeenCalledWith({
            where: {
                id: domainEmployees[0].id.toString(),
            },
        });
    });

    it('should search employees', async () => {
        const pagination: Pagination<EmployeeSortOptions> = {
            limit: 5,
            sort: {
                createdAt: 'desc',
                name: 'asc',
            },
        };

        const filter: EmployeeSearchFilter = {
            name: 'My name',
            documentId: DocumentId.create('12345678901'),
            gender: Gender.MALE,
            profiles: [PersonProfile.CUSTOMER],
            companyName: 'company',
            personType: PersonType.LEGAL,
        };

        jest.spyOn(prisma.employee, 'findMany').mockResolvedValueOnce(databaseEmployees);
        jest.spyOn(prisma.employee, 'count').mockResolvedValueOnce(databaseEmployees.length);

        await expect(repository.search(companyId, pagination, filter)).resolves.toEqual({
            data: domainEmployees,
            totalCount: databaseEmployees.length,
            nextCursor: null,
        });

        expect(prisma.employee.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.employee.findMany).toHaveBeenCalledWith({
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
                positionId: filter.positionId?.toString(),
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

        expect(prisma.employee.count).toHaveBeenCalledTimes(1);
        expect(prisma.employee.count).toHaveBeenCalledWith({
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
                positionId: filter.positionId?.toString(),
            },
        });
    });

    it('should paginate employees', async () => {
        const pagination: Pagination<EmployeeSortOptions> = {
            limit: 1,
            sort: {},
        };

        jest.spyOn(prisma.employee, 'findMany').mockResolvedValueOnce(databaseEmployees.slice(0, pagination.limit + 1));
        jest.spyOn(prisma.employee, 'count').mockResolvedValueOnce(databaseEmployees.length);

        const result = await repository.search(companyId, pagination);

        expect(result).toEqual({
            data: [domainEmployees[0]],
            totalCount: databaseEmployees.length,
            nextCursor: databaseEmployees[1].id,
        });

        expect(prisma.employee.findMany).toHaveBeenCalledWith({
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
                positionId: undefined,
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

        jest.spyOn(prisma.employee, 'findMany').mockResolvedValueOnce(databaseEmployees.slice(1, pagination.limit + 2));
        jest.spyOn(prisma.employee, 'count').mockResolvedValueOnce(databaseEmployees.length);

        await expect(
            repository.search(companyId, {
                ...pagination,
                cursor: result.nextCursor!,
            })
        ).resolves.toEqual({
            data: [domainEmployees[1]],
            totalCount: databaseEmployees.length,
            nextCursor: databaseEmployees[2].id,
        });

        expect(prisma.employee.findMany).toHaveBeenCalledWith({
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
                positionId: undefined,
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
