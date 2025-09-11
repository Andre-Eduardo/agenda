import type {PaginatedList, Pagination} from '../@shared/repository';
import type {CompanyId} from '../company/entities';
import type {ProductCategory, ProductCategoryId} from './entities';

export type ProductCategorySearchFilter = {
    name?: string;
};

export type ProductCategorySortOptions = ['name', 'createdAt', 'updatedAt'];

export interface ProductCategoryRepository {
    findById(id: ProductCategoryId): Promise<ProductCategory | null>;

    search(
        companyId: CompanyId,
        pagination: Pagination<ProductCategorySortOptions>,
        filter?: ProductCategorySearchFilter
    ): Promise<PaginatedList<ProductCategory>>;

    save(productCategory: ProductCategory): Promise<void>;

    delete(id: ProductCategoryId): Promise<void>;
}

export abstract class ProductCategoryRepository {}
