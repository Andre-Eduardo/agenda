import {CompanyId} from '../../../company/entities';
import {ProductCategory, ProductCategoryId} from '../product-category.entity';

export function fakeProductCategory(payload: Partial<ProductCategory> = {}): ProductCategory {
    return new ProductCategory({
        id: ProductCategoryId.generate(),
        companyId: CompanyId.generate(),
        name: 'Drinks',
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
        ...payload,
    });
}
