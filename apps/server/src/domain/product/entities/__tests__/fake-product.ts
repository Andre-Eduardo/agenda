import {CompanyId} from '../../../company/entities';
import {ProductCategoryId} from '../../../product-category/entities';
import {Product, ProductId} from '../index';

export function fakeProduct(payload: Partial<Product> = {}): Product {
    return new Product({
        id: ProductId.generate(),
        categoryId: ProductCategoryId.generate(),
        name: 'Product',
        code: 1,
        price: 100,
        companyId: CompanyId.generate(),
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
        ...payload,
    });
}
