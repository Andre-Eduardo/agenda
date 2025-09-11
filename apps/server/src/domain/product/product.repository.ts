import type {PaginatedList, Pagination} from '../@shared/repository';
import type {CompanyId} from '../company/entities';
import type {ProductCategoryId} from '../product-category/entities';
import type {Product, ProductId} from './entities';

export type ProductSearchFilter = {
    name?: string;
    code?: number;
    price?: number;
    categoryId?: ProductCategoryId;
};

export type ProductSortOptions = ['name', 'code', 'price', 'createdAt', 'updatedAt'];

export interface ProductRepository {
    findById(id: ProductId): Promise<Product | null>;

    search(
        companyId: CompanyId,
        pagination: Pagination<ProductSortOptions>,
        filter?: ProductSearchFilter
    ): Promise<PaginatedList<Product>>;

    save(product: Product): Promise<void>;

    delete(id: ProductId): Promise<void>;
}

export abstract class ProductRepository {}
