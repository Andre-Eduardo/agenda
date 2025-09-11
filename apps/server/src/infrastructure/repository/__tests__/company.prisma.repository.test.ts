import {mockDeep} from 'jest-mock-extended';
import type {Pagination} from '../../../domain/@shared/repository';
import type {CompanySearchFilter, CompanySortOptions} from '../../../domain/company/company.repository';
import type {Company} from '../../../domain/company/entities';
import {fakeCompany} from '../../../domain/company/entities/__tests__/fake-company';
import type {CompanyModel} from '../index';
import {CompanyPrismaRepository} from '../index';
import type {PrismaService} from '../prisma';

describe('A company repository backed by Prisma ORM', () => {
    const prisma = mockDeep<PrismaService>();
    const repository = new CompanyPrismaRepository(prisma);

    const domainCompanies: Company[] = [
        fakeCompany({
            name: 'Company 101',
        }),
        fakeCompany({
            name: 'Company 102',
        }),
        fakeCompany({
            name: 'Company 103',
        }),
    ];

    const databaseCompanies: CompanyModel[] = [
        {
            id: domainCompanies[0].id.toString(),
            name: domainCompanies[0].name,
            createdAt: domainCompanies[0].createdAt,
            updatedAt: domainCompanies[0].updatedAt,
        },
        {
            id: domainCompanies[1].id.toString(),
            name: domainCompanies[1].name,
            createdAt: domainCompanies[1].createdAt,
            updatedAt: domainCompanies[1].updatedAt,
        },
        {
            id: domainCompanies[2].id.toString(),
            name: domainCompanies[2].name,
            createdAt: domainCompanies[2].createdAt,
            updatedAt: domainCompanies[2].updatedAt,
        },
    ];

    it.each([
        [null, null],
        [databaseCompanies[0], domainCompanies[0]],
    ])('should find a company by ID', async (databaseCompany, domainCompany) => {
        jest.spyOn(prisma.company, 'findUnique').mockResolvedValueOnce(databaseCompany);

        await expect(repository.findById(domainCompanies[0].id)).resolves.toEqual(domainCompany);

        expect(prisma.company.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.company.findUnique).toHaveBeenCalledWith({
            where: {
                id: domainCompanies[0].id.toString(),
            },
        });
    });

    it('should search companies', async () => {
        const pagination: Pagination<CompanySortOptions> = {
            limit: 10,
            sort: {
                createdAt: 'desc',
                name: 'asc',
            },
        };

        const filter: CompanySearchFilter = {
            name: 'Company',
        };

        jest.spyOn(prisma.company, 'findMany').mockResolvedValueOnce(databaseCompanies);
        jest.spyOn(prisma.company, 'count').mockResolvedValueOnce(databaseCompanies.length);

        await expect(repository.search(pagination, filter)).resolves.toEqual({
            data: domainCompanies,
            totalCount: databaseCompanies.length,
            nextCursor: null,
        });

        expect(prisma.company.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.company.findMany).toHaveBeenCalledWith({
            where: {
                name: {
                    mode: 'insensitive',
                    contains: filter.name,
                },
            },
            take: 11,
            orderBy: [
                {
                    createdAt: 'desc',
                },
                {
                    name: 'asc',
                },
                {
                    id: 'asc',
                },
            ],
        });

        expect(prisma.company.count).toHaveBeenCalledTimes(1);
        expect(prisma.company.count).toHaveBeenCalledWith({
            where: {
                name: {
                    mode: 'insensitive',
                    contains: filter.name,
                },
            },
        });
    });

    it('should paginate companies', async () => {
        const pagination: Pagination<CompanySortOptions> = {
            limit: 1,
            sort: {},
        };

        jest.spyOn(prisma.company, 'findMany').mockResolvedValueOnce(databaseCompanies.slice(0, pagination.limit + 1));
        jest.spyOn(prisma.company, 'count').mockResolvedValueOnce(databaseCompanies.length);

        const result = await repository.search(pagination);

        expect(result).toEqual({
            data: [domainCompanies[0]],
            totalCount: databaseCompanies.length,
            nextCursor: databaseCompanies[1].id,
        });

        expect(prisma.company.findMany).toHaveBeenCalledWith({
            where: {
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

        jest.spyOn(prisma.company, 'findMany').mockResolvedValueOnce(databaseCompanies.slice(1, pagination.limit + 2));
        jest.spyOn(prisma.company, 'count').mockResolvedValueOnce(databaseCompanies.length);

        await expect(
            repository.search({
                ...pagination,
                cursor: result.nextCursor!,
            })
        ).resolves.toEqual({
            data: [domainCompanies[1]],
            totalCount: databaseCompanies.length,
            nextCursor: databaseCompanies[2].id,
        });

        expect(prisma.company.findMany).toHaveBeenCalledWith({
            where: {
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

    it('should save a company', async () => {
        jest.spyOn(prisma.company, 'upsert');

        await repository.save(domainCompanies[1]);

        expect(prisma.company.upsert).toHaveBeenCalledTimes(1);
        expect(prisma.company.upsert).toHaveBeenCalledWith({
            where: {
                id: domainCompanies[1].id.toString(),
            },
            create: databaseCompanies[1],
            update: databaseCompanies[1],
        });
    });

    it('should delete a company by ID', async () => {
        jest.spyOn(prisma.company, 'delete');

        await repository.delete(domainCompanies[0].id);

        expect(prisma.company.delete).toHaveBeenCalledTimes(1);
        expect(prisma.company.delete).toHaveBeenCalledWith({
            where: {
                id: domainCompanies[0].id.toString(),
            },
        });
    });
});
