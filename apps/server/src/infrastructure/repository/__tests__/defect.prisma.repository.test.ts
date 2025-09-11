import {mockDeep} from 'jest-mock-extended';
import type {Pagination} from '../../../domain/@shared/repository';
import {CompanyId} from '../../../domain/company/entities';
import type {DefectSearchFilter, DefectSortOptions} from '../../../domain/defect/defect.repository';
import type {Defect} from '../../../domain/defect/entities';
import {fakeDefect} from '../../../domain/defect/entities/__tests__/fake-defect';
import {UserId} from '../../../domain/user/entities';
import type {DefectModel} from '../defect.prisma.repository';
import {DefectPrismaRepository} from '../defect.prisma.repository';
import type {PrismaService} from '../prisma';

describe('A defect repository backed by Prisma ORM', () => {
    const prisma = mockDeep<PrismaService>();
    const repository = new DefectPrismaRepository(prisma);

    const companyId = CompanyId.generate();

    const domainDefects: Defect[] = [
        fakeDefect({
            note: 'Defect 1',
        }),
        fakeDefect({
            note: null,
            finishedById: UserId.generate(),
            finishedAt: new Date(),
        }),
    ];

    const databaseDefects: DefectModel[] = [
        {
            id: domainDefects[0].id.toString(),
            companyId: domainDefects[0].companyId.toString(),
            note: domainDefects[0].note,
            roomId: domainDefects[0].roomId.toString(),
            defectTypeId: domainDefects[0].defectTypeId.toString(),
            createdById: domainDefects[0].createdById.toString(),
            finishedById: domainDefects[0].finishedById?.toString() ?? null,
            finishedAt: domainDefects[0].finishedAt ?? null,
            createdAt: domainDefects[0].createdAt,
            updatedAt: domainDefects[0].updatedAt,
        },
        {
            id: domainDefects[1].id.toString(),
            companyId: domainDefects[1].companyId.toString(),
            note: domainDefects[1].note,
            roomId: domainDefects[1].roomId.toString(),
            defectTypeId: domainDefects[1].defectTypeId.toString(),
            createdById: domainDefects[1].createdById.toString(),
            finishedById: domainDefects[1].finishedById?.toString() ?? null,
            finishedAt: domainDefects[1].finishedAt ?? null,
            createdAt: domainDefects[1].createdAt,
            updatedAt: domainDefects[1].updatedAt,
        },
    ];

    it.each([
        [null, null],
        [databaseDefects[0], domainDefects[0]],
    ])('should find a defect by ID', async (databaseDefect, domainDefect) => {
        jest.spyOn(prisma.defect, 'findUnique').mockResolvedValueOnce(databaseDefect);

        await expect(repository.findById(domainDefects[0].id)).resolves.toEqual(domainDefect);

        expect(prisma.defect.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.defect.findUnique).toHaveBeenCalledWith({
            where: {
                id: domainDefects[0].id.toString(),
            },
        });
    });

    it('should search defects', async () => {
        const pagination: Pagination<DefectSortOptions> = {
            limit: 10,
            sort: {
                createdAt: 'desc',
            },
        };

        const filter: DefectSearchFilter = {
            note: 'Defect',
        };

        jest.spyOn(prisma.defect, 'findMany').mockResolvedValueOnce(databaseDefects);
        jest.spyOn(prisma.defect, 'count').mockResolvedValueOnce(databaseDefects.length);

        await expect(repository.search(companyId, pagination, filter)).resolves.toEqual({
            data: domainDefects,
            totalCount: databaseDefects.length,
            nextCursor: null,
        });

        expect(prisma.defect.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.defect.findMany).toHaveBeenCalledWith({
            where: {
                companyId: companyId.toString(),
                note: {
                    mode: 'insensitive',
                    contains: filter.note,
                },
                id: {
                    in: undefined,
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

    it('should paginate defects', async () => {
        const pagination: Pagination<DefectSortOptions> = {
            limit: 1,
            cursor: 'some-cursor',
            sort: {},
        };

        const filter: DefectSearchFilter = {
            note: 'Defect',
            defectIds: [domainDefects[0].id],
        };

        jest.spyOn(prisma.defect, 'findMany').mockResolvedValueOnce(databaseDefects.slice(0, pagination.limit + 1));
        jest.spyOn(prisma.defect, 'count').mockResolvedValueOnce(databaseDefects.length);

        const result = await repository.search(companyId, pagination, filter);

        expect(result).toEqual({
            data: [domainDefects[0]],
            totalCount: databaseDefects.length,
            nextCursor: databaseDefects[1].id,
        });

        expect(prisma.defect.findMany).toHaveBeenCalledWith({
            where: {
                companyId: companyId.toString(),
                note: {
                    mode: 'insensitive',
                    contains: filter.note,
                },
                id: {
                    in: [domainDefects[0].id.toString()],
                },
            },
            cursor: {
                id: pagination.cursor,
            },
            take: 2,
            orderBy: [{id: 'asc'}],
        });
    });

    it('should save a defect', async () => {
        jest.spyOn(prisma.defect, 'upsert');

        await repository.save(domainDefects[0]);

        expect(prisma.defect.upsert).toHaveBeenCalledTimes(1);
        expect(prisma.defect.upsert).toHaveBeenCalledWith({
            where: {
                id: domainDefects[0].id.toString(),
            },
            update: databaseDefects[0],
            create: databaseDefects[0],
        });
    });

    it('should delete a defect by ID', async () => {
        jest.spyOn(prisma.defect, 'delete');

        await repository.delete(domainDefects[0].id);

        expect(prisma.defect.delete).toHaveBeenCalledTimes(1);
        expect(prisma.defect.delete).toHaveBeenCalledWith({
            where: {
                id: domainDefects[0].id.toString(),
            },
        });
    });
});
