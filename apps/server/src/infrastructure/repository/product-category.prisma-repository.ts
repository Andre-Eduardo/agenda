import {Injectable} from '@nestjs/common';
import PrismaClient, {Prisma} from '@prisma/client';
import {DuplicateNameException} from '../../domain/@shared/exceptions';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {CompanyId} from '../../domain/company/entities';
import {ProductCategory, ProductCategoryId} from '../../domain/product-category/entities';
import {
    ProductCategoryRepository,
    ProductCategorySearchFilter,
    ProductCategorySortOptions,
} from '../../domain/product-category/product-category.repository';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';

export type ProductCategoryModel = PrismaClient.ProductCategory;

@Injectable()
export class ProductCategoryPrismaRepository extends PrismaRepository implements ProductCategoryRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    private static normalize(productCategory: ProductCategoryModel): ProductCategory {
        return new ProductCategory({
            ...productCategory,
            id: ProductCategoryId.from(productCategory.id),
            companyId: CompanyId.from(productCategory.companyId),
        });
    }

    private static denormalize(productCategory: ProductCategory): ProductCategoryModel {
        return {
            id: productCategory.id.toString(),
            companyId: productCategory.companyId.toString(),
            name: productCategory.name,
            createdAt: productCategory.createdAt,
            updatedAt: productCategory.updatedAt,
        };
    }

    async findById(id: ProductCategoryId): Promise<ProductCategory | null> {
        const productCategory = await this.prisma.productCategory.findUnique({
            where: {id: id.toString()},
        });

        return productCategory === null ? null : ProductCategoryPrismaRepository.normalize(productCategory);
    }

    async search(
        companyId: CompanyId,
        pagination: Pagination<ProductCategorySortOptions>,
        filter?: ProductCategorySearchFilter
    ): Promise<PaginatedList<ProductCategory>> {
        const where: Prisma.ProductCategoryWhereInput = {
            companyId: companyId.toString(),
            name: {
                mode: 'insensitive',
                contains: filter?.name,
            },
        };

        const [productCategories, totalCount] = await Promise.all([
            this.prisma.productCategory.findMany({
                where,
                ...(pagination.cursor && {
                    cursor: {
                        id: pagination.cursor,
                    },
                }),
                take: pagination.limit + 1,
                orderBy: this.normalizeSort(pagination.sort).concat({id: 'asc'}),
            }),
            this.prisma.productCategory.count({where}),
        ]);

        return {
            data: productCategories
                .slice(0, pagination.limit)
                .map((productCategory) => ProductCategoryPrismaRepository.normalize(productCategory)),
            totalCount,
            nextCursor:
                productCategories.length > pagination.limit ? productCategories[productCategories.length - 1].id : null,
        };
    }

    async save(productCategory: ProductCategory): Promise<void> {
        const productCategoryModel = ProductCategoryPrismaRepository.denormalize(productCategory);

        try {
            await this.prisma.productCategory.upsert({
                where: {
                    id: productCategoryModel.id,
                },
                create: productCategoryModel,
                update: productCategoryModel,
            });
        } catch (e) {
            if (this.checkUniqueViolation(e, 'name')) {
                throw new DuplicateNameException('Duplicate product category name.');
            }

            throw e;
        }
    }

    async delete(id: ProductCategoryId): Promise<void> {
        await this.prisma.productCategory.delete({
            where: {
                id: id.toString(),
            },
        });
    }
}
