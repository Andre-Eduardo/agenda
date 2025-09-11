import {Prisma} from '@prisma/client';
import {mockDeep} from 'jest-mock-extended';
import {DuplicateNameException} from '../../../domain/@shared/exceptions';
import type {Pagination} from '../../../domain/@shared/repository';
import {CompanyId} from '../../../domain/company/entities';
import type {DefectTypeSearchFilter, DefectTypeSortOptions} from '../../../domain/defect-type/defect-type.repository';
import type {DefectType} from '../../../domain/defect-type/entities';
import {fakeDefectType} from '../../../domain/defect-type/entities/__tests__/fake-defect-type';
import type {DefectTypeModel} from '../defect-type.prisma.repository';
import {DefectTypePrismaRepository} from '../defect-type.prisma.repository';
import type {PrismaService} from '../prisma';

describe('A defect type repository backed by Prisma ORM', () => {
    const prisma = mockDeep<PrismaService>();
    const repository = new DefectTypePrismaRepository(prisma);

    const companyId = CompanyId.generate();

    const domainDefectTypes: DefectType[] = [
        fakeDefectType({
            name: 'defect type 1',
        }),
        fakeDefectType({
            name: 'defect type 2',
        }),
    ];

    const databaseDefectTypes: DefectTypeModel[] = [
        {
            id: domainDefectTypes[0].id.toString(),
            companyId: domainDefectTypes[0].companyId.toString(),
            name: domainDefectTypes[0].name,
            createdAt: domainDefectTypes[0].createdAt,
            updatedAt: domainDefectTypes[0].updatedAt,
        },
        {
            id: domainDefectTypes[1].id.toString(),
            companyId: domainDefectTypes[1].companyId.toString(),
            name: domainDefectTypes[1].name,
            createdAt: domainDefectTypes[1].createdAt,
            updatedAt: domainDefectTypes[1].updatedAt,
        },
    ];

    it.each([
        [null, null],
        [databaseDefectTypes[0], domainDefectTypes[0]],
    ])('should find a defect type by ID', async (databaseDefectType, domainDefectType) => {
        jest.spyOn(prisma.defectType, 'findUnique').mockResolvedValueOnce(databaseDefectType);

        await expect(repository.findById(domainDefectTypes[0].id)).resolves.toEqual(domainDefectType);

        expect(prisma.defectType.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.defectType.findUnique).toHaveBeenCalledWith({
            where: {
                id: domainDefectTypes[0].id.toString(),
            },
        });
    });

    it('should search defect type', async () => {
        const pagination: Pagination<DefectTypeSortOptions> = {
            limit: 10,
            sort: {
                createdAt: 'desc',
            },
        };

        const filter: DefectTypeSearchFilter = {
            name: 'defect type 1',
        };

        jest.spyOn(prisma.defectType, 'findMany').mockResolvedValueOnce(databaseDefectTypes);
        jest.spyOn(prisma.defectType, 'count').mockResolvedValueOnce(databaseDefectTypes.length);

        await expect(repository.search(companyId, pagination, filter)).resolves.toEqual({
            data: domainDefectTypes,
            totalCount: databaseDefectTypes.length,
            nextCursor: null,
        });

        expect(prisma.defectType.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.defectType.findMany).toHaveBeenCalledWith({
            where: {
                categoryId: undefined,
                companyId: companyId.toString(),
                name: {
                    mode: 'insensitive',
                    contains: filter.name,
                },
            },
            take: pagination.limit + 1,
            orderBy: [
                {
                    createdAt: 'desc',
                },
                {
                    id: 'asc',
                },
            ],
        });
    });

    it('should paginate defect type', async () => {
        const pagination: Pagination<DefectTypeSortOptions> = {
            limit: 1,
            cursor: 'some-cursor',
            sort: {},
        };

        const filter: DefectTypeSearchFilter = {
            name: 'defect type',
        };

        jest.spyOn(prisma.defectType, 'findMany').mockResolvedValueOnce(
            databaseDefectTypes.slice(0, pagination.limit + 1)
        );
        jest.spyOn(prisma.defectType, 'count').mockResolvedValueOnce(databaseDefectTypes.length);

        const result = await repository.search(companyId, pagination, filter);

        expect(result).toEqual({
            data: [domainDefectTypes[0]],
            totalCount: databaseDefectTypes.length,
            nextCursor: databaseDefectTypes[1].id,
        });

        expect(prisma.defectType.findMany).toHaveBeenCalledWith({
            where: {
                companyId: companyId.toString(),
                name: {
                    mode: 'insensitive',
                    contains: filter.name,
                },
            },
            cursor: {
                id: pagination.cursor,
            },
            take: 2,
            orderBy: [{id: 'asc'}],
        });
    });

    it('should save a defect type', async () => {
        jest.spyOn(prisma.defectType, 'upsert');

        await repository.save(domainDefectTypes[1]);

        expect(prisma.defectType.upsert).toHaveBeenCalledTimes(1);
        expect(prisma.defectType.upsert).toHaveBeenCalledWith({
            where: {
                id: domainDefectTypes[1].id.toString(),
            },
            update: databaseDefectTypes[1],
            create: databaseDefectTypes[1],
        });
    });

    it('should delete a defect type by ID', async () => {
        jest.spyOn(prisma.defectType, 'delete');

        await repository.delete(domainDefectTypes[0].id);

        expect(prisma.defectType.delete).toHaveBeenCalledTimes(1);
        expect(prisma.defectType.delete).toHaveBeenCalledWith({
            where: {
                id: domainDefectTypes[0].id.toString(),
            },
        });
    });

    it('should throw an exception when saving a defect type with a duplicate name', async () => {
        jest.spyOn(prisma.defectType, 'upsert').mockRejectedValueOnce(
            new Prisma.PrismaClientKnownRequestError('Unique constraint violation', {
                clientVersion: '0.0.0',
                code: 'P2002',
                meta: {
                    target: ['name'],
                },
            })
        );

        await expect(repository.save(domainDefectTypes[0])).rejects.toThrowWithMessage(
            DuplicateNameException,
            'Duplicate defect type name.'
        );
    });

    it('should rethrow an unknown error when saving a defect type', async () => {
        const error = new Error('Unknown error');

        jest.spyOn(prisma.defectType, 'upsert').mockRejectedValueOnce(error);

        await expect(repository.save(domainDefectTypes[0])).rejects.toThrow(error);
    });
});
