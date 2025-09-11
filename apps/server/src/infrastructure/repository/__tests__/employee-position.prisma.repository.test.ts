import {Prisma} from '@prisma/client';
import {mockDeep} from 'jest-mock-extended';
import {DuplicateNameException} from '../../../domain/@shared/exceptions';
import type {Pagination} from '../../../domain/@shared/repository';
import {CompanyId} from '../../../domain/company/entities';
import type {
    EmployeePositionSearchFilter,
    EmployeePositionSortOptions,
} from '../../../domain/employee-position/employee-position.repository';
import type {EmployeePosition} from '../../../domain/employee-position/entities';
import {fakeEmployeePosition} from '../../../domain/employee-position/entities/__tests__/fake-employee-position';
import {UserId} from '../../../domain/user/entities';
import type {EmployeePositionModel} from '../employee-position.prisma.repository';
import {EmployeePositionPrismaRepository} from '../employee-position.prisma.repository';
import type {PrismaService} from '../prisma';

describe('A employee position repository backed by Prisma ORM', () => {
    const prisma = mockDeep<PrismaService>();
    const repository = new EmployeePositionPrismaRepository(prisma);
    const companyId = CompanyId.generate();

    const domainEmployeePositions: EmployeePosition[] = [
        fakeEmployeePosition({
            companyId,
            name: 'Employee Position 1',
        }),
        fakeEmployeePosition({
            companyId,
            name: 'Employee Position 2',
        }),
        fakeEmployeePosition({
            companyId,
            name: 'Employee Position 3',
        }),
        fakeEmployeePosition({
            companyId,
            name: 'Employee Position 4',
        }),
    ];

    const databaseEmployeePositions: EmployeePositionModel[] = [
        {
            id: domainEmployeePositions[0].id.toString(),
            companyId: domainEmployeePositions[0].companyId.toString(),
            name: domainEmployeePositions[0].name,
            permissions: Array.from(domainEmployeePositions[0].permissions),
            createdAt: domainEmployeePositions[0].createdAt,
            updatedAt: domainEmployeePositions[0].updatedAt,
        },
        {
            id: domainEmployeePositions[1].id.toString(),
            companyId: domainEmployeePositions[1].companyId.toString(),
            name: domainEmployeePositions[1].name,
            permissions: Array.from(domainEmployeePositions[1].permissions),
            createdAt: domainEmployeePositions[1].createdAt,
            updatedAt: domainEmployeePositions[1].updatedAt,
        },
        {
            id: domainEmployeePositions[2].id.toString(),
            companyId: domainEmployeePositions[2].companyId.toString(),
            name: domainEmployeePositions[2].name,
            permissions: Array.from(domainEmployeePositions[2].permissions),
            createdAt: domainEmployeePositions[2].createdAt,
            updatedAt: domainEmployeePositions[2].updatedAt,
        },
        {
            id: domainEmployeePositions[3].id.toString(),
            companyId: domainEmployeePositions[3].companyId.toString(),
            name: domainEmployeePositions[3].name,
            permissions: Array.from(domainEmployeePositions[3].permissions),
            createdAt: domainEmployeePositions[3].createdAt,
            updatedAt: domainEmployeePositions[3].updatedAt,
        },
    ];

    it.each([
        [null, null],
        [databaseEmployeePositions[0], domainEmployeePositions[0]],
    ])('should find an employee position by ID', async (databaseEmployeePosition, domainEmployeePosition) => {
        jest.spyOn(prisma.employeePosition, 'findUnique').mockResolvedValueOnce(databaseEmployeePosition);

        await expect(repository.findById(domainEmployeePositions[0].id)).resolves.toEqual(domainEmployeePosition);

        expect(prisma.employeePosition.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.employeePosition.findUnique).toHaveBeenCalledWith({
            where: {
                id: domainEmployeePositions[0].id.toString(),
            },
        });
    });

    it.each([
        [null, null],
        [databaseEmployeePositions[0], domainEmployeePositions[0]],
    ])('should find an employee position by ID', async (databaseEmployeePosition, domainEmployeePosition) => {
        const userId = UserId.generate();

        jest.spyOn(prisma.employeePosition, 'findFirst').mockResolvedValueOnce(databaseEmployeePosition);

        await expect(repository.findByUser(companyId, userId)).resolves.toEqual(domainEmployeePosition);

        expect(prisma.employeePosition.findFirst).toHaveBeenCalledTimes(1);
        expect(prisma.employeePosition.findFirst).toHaveBeenCalledWith({
            where: {
                companyId: companyId.toString(),
                employees: {
                    some: {
                        userId: userId.toString(),
                    },
                },
            },
        });
    });

    it('should search employee positions', async () => {
        const pagination: Pagination<EmployeePositionSortOptions> = {
            limit: 10,
            sort: {
                name: 'asc',
            },
        };

        const filter: EmployeePositionSearchFilter = {
            name: 'Employee Position',
        };

        jest.spyOn(prisma.employeePosition, 'findMany').mockResolvedValueOnce(databaseEmployeePositions);
        jest.spyOn(prisma.employeePosition, 'count').mockResolvedValueOnce(databaseEmployeePositions.length);

        await expect(repository.search(companyId, pagination, filter)).resolves.toEqual({
            data: domainEmployeePositions,
            totalCount: databaseEmployeePositions.length,
            nextCursor: null,
        });

        expect(prisma.employeePosition.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.employeePosition.findMany).toHaveBeenCalledWith({
            take: 11,
            where: {
                companyId: companyId.toString(),
                name: {
                    mode: 'insensitive',
                    contains: filter.name,
                },
            },
            orderBy: [
                {
                    name: 'asc',
                },
                {
                    id: 'asc',
                },
            ],
        });

        expect(prisma.employeePosition.count).toHaveBeenCalledTimes(1);
        expect(prisma.employeePosition.count).toHaveBeenCalledWith({
            where: {
                companyId: companyId.toString(),
                name: {
                    mode: 'insensitive',
                    contains: filter.name,
                },
            },
        });
    });

    it('should paginate employee positions', async () => {
        const pagination: Pagination<EmployeePositionSortOptions> = {
            limit: 1,
            sort: {},
        };

        jest.spyOn(prisma.employeePosition, 'findMany').mockResolvedValueOnce(
            databaseEmployeePositions.slice(0, pagination.limit + 1)
        );
        jest.spyOn(prisma.employeePosition, 'count').mockResolvedValueOnce(databaseEmployeePositions.length);

        const result = await repository.search(companyId, pagination);

        expect(result).toEqual({
            data: [domainEmployeePositions[0]],
            totalCount: databaseEmployeePositions.length,
            nextCursor: databaseEmployeePositions[1].id,
        });

        expect(prisma.employeePosition.findMany).toHaveBeenCalledWith({
            where: {
                companyId: companyId.toString(),
                name: {
                    mode: 'insensitive',
                    contains: undefined,
                },
            },
            take: 2,
            orderBy: [
                {
                    id: 'asc',
                },
            ],
        });
    });

    it('should paginate employee positions with a cursor', async () => {
        const pagination: Pagination<EmployeePositionSortOptions> = {
            limit: 1,
            cursor: 'some-cursor',
            sort: {},
        };

        jest.spyOn(prisma.employeePosition, 'findMany').mockResolvedValueOnce(
            databaseEmployeePositions.slice(0, pagination.limit + 1)
        );
        jest.spyOn(prisma.employeePosition, 'count').mockResolvedValueOnce(databaseEmployeePositions.length);

        const result = await repository.search(companyId, pagination);

        expect(result).toEqual({
            data: [domainEmployeePositions[0]],
            totalCount: databaseEmployeePositions.length,
            nextCursor: databaseEmployeePositions[1].id,
        });

        expect(prisma.employeePosition.findMany).toHaveBeenCalledWith({
            where: {
                companyId: companyId.toString(),
                name: {
                    mode: 'insensitive',
                    contains: undefined,
                },
            },
            cursor: {
                id: pagination.cursor,
            },
            take: 2,
            orderBy: [
                {
                    id: 'asc',
                },
            ],
        });
    });

    it('should save an employee position', async () => {
        jest.spyOn(prisma.employeePosition, 'upsert');

        await repository.save(domainEmployeePositions[0]);

        expect(prisma.employeePosition.upsert).toHaveBeenCalledTimes(1);
        expect(prisma.employeePosition.upsert).toHaveBeenCalledWith({
            where: {
                id: databaseEmployeePositions[0].id.toString(),
            },
            create: databaseEmployeePositions[0],
            update: databaseEmployeePositions[0],
        });
    });

    it('should throw an error when saving an employee position with a duplicate name', async () => {
        jest.spyOn(prisma.employeePosition, 'upsert').mockRejectedValueOnce(
            new Prisma.PrismaClientKnownRequestError('Unique constraint violation', {
                clientVersion: '0.0.0',
                code: 'P2002',
                meta: {
                    target: ['name'],
                },
            })
        );
        await expect(repository.save(domainEmployeePositions[0])).rejects.toThrowWithMessage(
            DuplicateNameException,
            'Duplicate employee position name.'
        );
    });

    it('should throw an unknown error when saving an employee position', async () => {
        jest.spyOn(prisma.employeePosition, 'upsert').mockRejectedValueOnce(new Error('Unknown error'));
        await expect(repository.save(domainEmployeePositions[0])).rejects.toThrowWithMessage(Error, 'Unknown error');
    });

    it('should delete a employee position by ID', async () => {
        jest.spyOn(prisma.employeePosition, 'delete');

        await repository.delete(domainEmployeePositions[0].id);

        expect(prisma.employeePosition.delete).toHaveBeenCalledTimes(1);
        expect(prisma.employeePosition.delete).toHaveBeenCalledWith({
            where: {
                id: domainEmployeePositions[0].id.toString(),
            },
        });
    });
});
