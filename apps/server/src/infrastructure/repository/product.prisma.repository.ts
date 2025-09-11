import {Injectable} from '@nestjs/common';
import PrismaClient from '@prisma/client';
import {PaginatedList, Pagination} from '../../domain/@shared/repository';
import {CompanyId} from '../../domain/company/entities';
import {Product, ProductId} from '../../domain/product/entities';
import {DuplicateCodeException} from '../../domain/product/product.exceptions';
import {ProductRepository, ProductSearchFilter, ProductSortOptions} from '../../domain/product/product.repository';
import {ProductCategoryId} from '../../domain/product-category/entities';
import {PrismaService} from './prisma';
import {PrismaRepository} from './prisma.repository';

export type ProductModel = PrismaClient.Product;

@Injectable()
export class ProductPrismaRepository extends PrismaRepository implements ProductRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    private static normalize(product: ProductModel): Product {
        return new Product({
            ...product,
            id: ProductId.from(product.id),
            companyId: CompanyId.from(product.companyId),
            categoryId: ProductCategoryId.from(product.categoryId),
        });
    }

    private static denormalize(product: Product): ProductModel {
        return {
            id: product.id.toString(),
            companyId: product.companyId.toString(),
            categoryId: product.categoryId.toString(),
            name: product.name,
            code: product.code,
            price: product.price,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
        };
    }

    async findById(id: ProductId): Promise<Product | null> {
        const product = await this.prisma.product.findUnique({
            where: {
                id: id.toString(),
            },
        });

        return product === null ? null : ProductPrismaRepository.normalize(product);
    }

    async search(
        companyId: CompanyId,
        pagination: Pagination<ProductSortOptions>,
        filter?: ProductSearchFilter
    ): Promise<PaginatedList<Product>> {
        const where: PrismaClient.Prisma.ProductWhereInput = {
            categoryId: filter?.categoryId?.toString(),
            companyId: companyId.toString(),
            name: {
                mode: 'insensitive',
                contains: filter?.name,
            },
            code: filter?.code,
            price: filter?.price,
        };

        const [products, totalCount] = await Promise.all([
            this.prisma.product.findMany({
                where,
                ...(pagination.cursor && {
                    cursor: {
                        id: pagination.cursor,
                    },
                }),
                take: pagination.limit + 1,
                orderBy: this.normalizeSort(pagination.sort, {id: 'asc'}),
            }),
            this.prisma.product.count({where}),
        ]);

        return {
            data: products.slice(0, pagination.limit).map((product) => ProductPrismaRepository.normalize(product)),
            totalCount,
            nextCursor: products.length > pagination.limit ? products[products.length - 1].id : null,
        };
    }

    async save(product: Product): Promise<void> {
        const productModel = ProductPrismaRepository.denormalize(product);

        try {
            await this.prisma.product.upsert({
                where: {
                    id: productModel.id,
                },
                update: productModel,
                create: productModel,
            });
        } catch (e) {
            if (this.checkUniqueViolation(e, 'code')) {
                throw new DuplicateCodeException('Duplicate product code.');
            }

            throw e;
        }
    }

    async delete(id: ProductId): Promise<void> {
        await this.prisma.product.delete({
            where: {
                id: id.toString(),
            },
        });
    }
}
