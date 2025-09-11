import {Injectable} from '@nestjs/common';
import PrismaClient, {Prisma} from '@prisma/client';
import {DuplicateNameException} from '../../domain/@shared/exceptions';
import type {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {CompanyId} from '../../domain/company/entities';
import {ServiceCategory, ServiceCategoryId} from '../../domain/service-category/entities';
import type {
    ServiceCategoryRepository,
    ServiceCategorySearchFilter,
    ServiceCategorySortOptions,
} from '../../domain/service-category/service-category.repository';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';

export type ServiceCategoryModel = PrismaClient.ServiceCategory;

@Injectable()
export class ServiceCategoryPrismaRepository extends PrismaRepository implements ServiceCategoryRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    private static normalize(serviceCategory: ServiceCategoryModel): ServiceCategory {
        return new ServiceCategory({
            ...serviceCategory,
            id: ServiceCategoryId.from(serviceCategory.id),
            companyId: CompanyId.from(serviceCategory.companyId),
        });
    }

    private static denormalize(serviceCategory: ServiceCategory): ServiceCategoryModel {
        return {
            id: serviceCategory.id.toString(),
            companyId: serviceCategory.companyId.toString(),
            name: serviceCategory.name,
            createdAt: serviceCategory.createdAt,
            updatedAt: serviceCategory.updatedAt,
        };
    }

    async findById(id: ServiceCategoryId): Promise<ServiceCategory | null> {
        const serviceCategory = await this.prisma.serviceCategory.findUnique({
            where: {id: id.toString()},
        });

        return serviceCategory === null ? null : ServiceCategoryPrismaRepository.normalize(serviceCategory);
    }

    async search(
        companyId: CompanyId,
        pagination: Pagination<ServiceCategorySortOptions>,
        filter?: ServiceCategorySearchFilter
    ): Promise<PaginatedList<ServiceCategory>> {
        const where: Prisma.ServiceCategoryWhereInput = {
            companyId: companyId.toString(),
            name: {
                mode: 'insensitive',
                contains: filter?.name,
            },
        };

        const [serviceCategories, totalCount] = await Promise.all([
            this.prisma.serviceCategory.findMany({
                where,
                ...(pagination.cursor && {
                    cursor: {
                        id: pagination.cursor,
                    },
                }),
                take: pagination.limit + 1,
                orderBy: this.normalizeSort(pagination.sort).concat({id: 'asc'}),
            }),
            this.prisma.serviceCategory.count({where}),
        ]);

        return {
            data: serviceCategories
                .slice(0, pagination.limit)
                .map((serviceCategory) => ServiceCategoryPrismaRepository.normalize(serviceCategory)),
            totalCount,
            nextCursor:
                serviceCategories.length > pagination.limit ? serviceCategories[serviceCategories.length - 1].id : null,
        };
    }

    async save(serviceCategory: ServiceCategory): Promise<void> {
        const serviceCategoryModel = ServiceCategoryPrismaRepository.denormalize(serviceCategory);

        try {
            await this.prisma.serviceCategory.upsert({
                where: {
                    id: serviceCategoryModel.id,
                },
                create: serviceCategoryModel,
                update: serviceCategoryModel,
            });
        } catch (e) {
            if (this.checkUniqueViolation(e, 'name')) {
                throw new DuplicateNameException('Duplicate service category name.');
            }

            throw e;
        }
    }

    async delete(id: ServiceCategoryId): Promise<void> {
        await this.prisma.serviceCategory.delete({
            where: {
                id: id.toString(),
            },
        });
    }
}
