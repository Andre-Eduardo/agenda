import {InvalidInputException} from '../../../@shared/exceptions';
import {CompanyId} from '../../../company/entities';
import {ProductCategoryId} from '../../../product-category/entities';
import {ProductChangedEvent, ProductCreatedEvent, ProductDeletedEvent} from '../../events';
import type {CreateProduct} from '../product.entity';
import {Product, ProductId} from '../product.entity';
import {fakeProduct} from './fake-product';

describe('A product', () => {
    const companyId = CompanyId.generate();
    const categoryId = ProductCategoryId.generate();
    const now = new Date(1000);

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('on creation', () => {
        it('should emit a product-created event', () => {
            const data: CreateProduct = {
                companyId,
                categoryId,
                name: 'Product 1',
                code: 1,
                price: 100,
            };

            const product = Product.create(data);

            expect(product.id).toBeInstanceOf(ProductId);
            expect(product.companyId).toBe(companyId);
            expect(product.categoryId).toBe(categoryId);
            expect(product.name).toBe(data.name);
            expect(product.code).toBe(data.code);
            expect(product.price).toBe(data.price);

            expect(product.events).toEqual([
                {
                    type: ProductCreatedEvent.type,
                    companyId,
                    product,
                    timestamp: now,
                },
            ]);
            expect(product.events[0]).toBeInstanceOf(ProductCreatedEvent);
        });

        it.each([
            [{name: ''}, 'Product name must be at least 1 character long.'],
            [{code: 0}, 'Product code must be greater than 0.'],
            [{price: -100}, 'Product price cannot be negative.'],
        ])('should throw an error when receiving invalid data', (input, expectedError) => {
            const product: CreateProduct = {
                companyId,
                categoryId,
                name: 'Product 1',
                code: 1,
                price: 100,
            };

            expect(() => Product.create({...product, ...input})).toThrowWithMessage(
                InvalidInputException,
                expectedError
            );
        });
    });

    describe('on change', () => {
        it('should emit a product-changed event', () => {
            const product = fakeProduct({
                companyId,
                categoryId,
            });

            const oldProduct = fakeProduct(product);
            const newCategoryId = ProductCategoryId.generate();

            product.change({
                name: 'Product 2',
                code: 2,
                price: 200,
                categoryId: newCategoryId,
            });

            expect(product.name).toBe('Product 2');
            expect(product.code).toBe(2);
            expect(product.price).toBe(200);
            expect(product.categoryId).toBe(newCategoryId);

            expect(product.events).toEqual([
                {
                    type: ProductChangedEvent.type,
                    timestamp: now,
                    companyId,
                    oldState: oldProduct,
                    newState: product,
                },
            ]);

            expect(product.events[0]).toBeInstanceOf(ProductChangedEvent);
        });

        it.each([
            [{name: ''}, 'Product name must be at least 1 character long.'],
            [{code: 0}, 'Product code must be greater than 0.'],
            [{price: -100}, 'Product price cannot be negative.'],
        ])('should throw an error when receiving invalid data', (input, expectedError) => {
            const product = fakeProduct({
                companyId,
                categoryId,
            });

            expect(() => product.change(input)).toThrowWithMessage(InvalidInputException, expectedError);
        });
    });

    describe('on deletion', () => {
        it('should emit a product-deleted event', () => {
            const product = fakeProduct({companyId, categoryId});

            product.delete();

            expect(product.events).toEqual([
                {
                    type: ProductDeletedEvent.type,
                    timestamp: now,
                    companyId,
                    product,
                },
            ]);

            expect(product.events[0]).toBeInstanceOf(ProductDeletedEvent);
        });
    });

    it('should be serializable', () => {
        const product = fakeProduct({
            companyId,
            categoryId,
            name: 'Product 1',
            code: 1,
            price: 100,
        });

        expect(product.toJSON()).toEqual({
            id: product.id.toString(),
            companyId: companyId.toJSON(),
            categoryId: categoryId.toJSON(),
            name: 'Product 1',
            code: 1,
            price: 100,
            createdAt: new Date(1000).toJSON(),
            updatedAt: new Date(1000).toJSON(),
        });
    });
});

describe('A product ID', () => {
    it('can be created from a string', () => {
        const uuid = '0c64d1cb-764d-44eb-bb3a-973a854dd449';
        const id = ProductId.from(uuid);

        expect(id.toString()).toBe(uuid);
    });

    it('can be generated', () => {
        expect(ProductId.generate()).toBeInstanceOf(ProductId);
    });
});
