import {Injectable} from '@nestjs/common';
import PrismaClient, {Prisma} from '@prisma/client';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {CompanyRepository, CompanySearchFilter, CompanySortOptions} from '../../domain/company/company.repository';
import {Company, CompanyId} from '../../domain/company/entities';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';

export type CompanyModel = PrismaClient.Company;

@Injectable()
export class CompanyPrismaRepository extends PrismaRepository implements CompanyRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    private static normalize(company: CompanyModel): Company {
        return new Company({
            ...company,
            id: CompanyId.from(company.id),
        });
    }

    private static denormalize(company: Company): CompanyModel {
        return {
            id: company.id.toString(),
            name: company.name,
            createdAt: company.createdAt,
            updatedAt: company.updatedAt,
        };
    }

    async findById(id: CompanyId): Promise<Company | null> {
        const company = await this.prisma.company.findUnique({
            where: {
                id: id.toString(),
            },
        });

        return company === null ? null : CompanyPrismaRepository.normalize(company);
    }

    async search(
        pagination: Pagination<CompanySortOptions>,
        filter?: CompanySearchFilter
    ): Promise<PaginatedList<Company>> {
        const where: Prisma.CompanyWhereInput = {
            name: {
                mode: 'insensitive',
                contains: filter?.name,
            },
        };

        const [companies, totalCount] = await Promise.all([
            this.prisma.company.findMany({
                where,
                ...(pagination.cursor && {
                    cursor: {
                        id: pagination.cursor,
                    },
                }),
                take: pagination.limit + 1,
                orderBy: this.normalizeSort(pagination.sort, {id: 'asc'}),
            }),
            this.prisma.company.count({where}),
        ]);

        return {
            data: companies.slice(0, pagination.limit).map((company) => CompanyPrismaRepository.normalize(company)),
            totalCount,
            nextCursor: companies.length > pagination.limit ? companies[companies.length - 1].id : null,
        };
    }

    async save(company: Company): Promise<void> {
        const companyModel = CompanyPrismaRepository.denormalize(company);

        await this.prisma.company.upsert({
            where: {
                id: companyModel.id,
            },
            create: companyModel,
            update: companyModel,
        });
    }

    async delete(id: CompanyId): Promise<void> {
        await this.prisma.company.delete({
            where: {
                id: id.toString(),
            },
        });
    }
}
