import {CompanyId} from '../../../company/entities';
import {ProductCategoryChangedEvent, ProductCategoryCreatedEvent, ProductCategoryDeletedEvent} from '../../events';
import {ProductCategory, ProductCategoryId} from '../product-category.entity';
import {fakeProductCategory} from './fake-product-category';

describe('A Product Category', () => {
    const now = new Date();
    const companyId = CompanyId.generate();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('on creation', () => {
        it('should emit a product-category-created event', () => {
            const name = 'Decorating';

            const productCategory = ProductCategory.create({companyId, name});

            expect(productCategory.name).toBe(name);

            expect(productCategory.events).toEqual([
                {
                    type: ProductCategoryCreatedEvent.type,
                    companyId: productCategory.companyId,
                    timestamp: now,
                    productCategory,
                },
            ]);

            expect(productCategory.events[0]).toBeInstanceOf(ProductCategoryCreatedEvent);
        });
    });

    describe('on change', () => {
        it('should emit a product-category-changed event', () => {
            const productCategory = fakeProductCategory({
                companyId,
            });

            const oldProductCategory = fakeProductCategory(productCategory);

            productCategory.change({name: 'New name'});

            expect(productCategory.name).toBe('New name');

            expect(productCategory.events).toEqual([
                {
                    type: ProductCategoryChangedEvent.type,
                    companyId: productCategory.companyId,
                    timestamp: now,
                    oldState: oldProductCategory,
                    newState: productCategory,
                },
            ]);

            expect(productCategory.events[0]).toBeInstanceOf(ProductCategoryChangedEvent);
        });

        it('should throw an error when receiving invalid data', () => {
            const productCategory = fakeProductCategory({
                companyId,
            });

            expect(() => productCategory.change({name: ''})).toThrow(
                'Product category name must be at least 1 character long.'
            );
        });
    });

    describe('on delete', () => {
        it('should emit a product-category-deleted event', () => {
            const productCategory = fakeProductCategory({
                companyId,
            });

            productCategory.delete();

            expect(productCategory.events).toEqual([
                {
                    type: ProductCategoryDeletedEvent.type,
                    companyId: productCategory.companyId,
                    timestamp: now,
                    productCategory,
                },
            ]);

            expect(productCategory.events[0]).toBeInstanceOf(ProductCategoryDeletedEvent);
        });
    });

    it('should be serializable', () => {
        const productCategory = fakeProductCategory({
            name: 'Food',
        });

        expect(productCategory.toJSON()).toEqual({
            id: productCategory.id.toJSON(),
            companyId: productCategory.companyId.toJSON(),
            name: 'Food',
            createdAt: productCategory.createdAt.toJSON(),
            updatedAt: productCategory.updatedAt.toJSON(),
        });
    });
});

describe('A product-category ID', () => {
    it('can be created from a string', () => {
        const uuid = '6267dbfa-177a-4596-882e-99572932ffce';
        const id = ProductCategoryId.from(uuid);

        expect(id.toString()).toBe(uuid);
    });

    it('can be generated', () => {
        expect(ProductCategoryId.generate()).toBeInstanceOf(ProductCategoryId);
    });
});
