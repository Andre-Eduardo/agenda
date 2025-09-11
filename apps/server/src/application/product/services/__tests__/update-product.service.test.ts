import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {PreconditionException, ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import {CompanyId} from '../../../../domain/company/entities';
import type {EventDispatcher} from '../../../../domain/event';
import {ProductId} from '../../../../domain/product/entities';
import {fakeProduct} from '../../../../domain/product/entities/__tests__/fake-product';
import {ProductChangedEvent} from '../../../../domain/product/events';
import {DuplicateCodeException} from '../../../../domain/product/product.exceptions';
import type {ProductRepository} from '../../../../domain/product/product.repository';
import {ProductCategoryId} from '../../../../domain/product-category/entities';
import {UserId} from '../../../../domain/user/entities';
import type {UpdateProductDto} from '../../dtos';
import {ProductDto} from '../../dtos';
import {UpdateProductService} from '../update-product.service';

describe('A update-product service', () => {
    const productRepository = mock<ProductRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const updateProductService = new UpdateProductService(productRepository, eventDispatcher);

    const companyId = CompanyId.generate();
    const categoryId = ProductCategoryId.generate();

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should update a product', async () => {
        const existingProduct = fakeProduct({
            id: ProductId.generate(),
            companyId,
            categoryId,
            name: 'Whiskey',
            code: 101,
            price: 200,
        });

        const oldProduct = fakeProduct(existingProduct);

        const payload: UpdateProductDto = {
            id: existingProduct.id,
            name: 'New name',
        };

        jest.spyOn(productRepository, 'findById').mockResolvedValueOnce(existingProduct);

        const updatedProduct = fakeProduct({
            ...existingProduct,
            ...payload,
            updatedAt: now,
        });

        await expect(updateProductService.execute({actor, payload})).resolves.toEqual(new ProductDto(updatedProduct));

        expect(existingProduct.name).toBe(payload.name);
        expect(existingProduct.updatedAt).toEqual(now);
        expect(existingProduct.events).toHaveLength(1);
        expect(existingProduct.events[0]).toBeInstanceOf(ProductChangedEvent);
        expect(existingProduct.events).toEqual([
            {
                type: ProductChangedEvent.type,
                companyId,
                timestamp: now,
                oldState: oldProduct,
                newState: existingProduct,
            },
        ]);
        expect(productRepository.save).toHaveBeenCalledWith(existingProduct);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingProduct);
    });

    it('should throw an error when the product code is already in use', async () => {
        const payload: UpdateProductDto = {
            id: ProductId.generate(),
            name: 'New name',
            code: 101,
        };

        const existingProduct = fakeProduct({
            companyId,
            categoryId,
            name: 'Whiskey',
            code: 101,
            price: 200,
        });

        jest.spyOn(productRepository, 'findById').mockResolvedValueOnce(existingProduct);
        jest.spyOn(productRepository, 'save').mockImplementationOnce(() => {
            throw new DuplicateCodeException();
        });

        await expect(updateProductService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot update a product with a code already in use.'
        );
    });

    it('should throw an error when failing to save the product', async () => {
        const payload: UpdateProductDto = {
            id: ProductId.generate(),
            name: 'New name',
        };

        const existingProduct = fakeProduct({
            companyId,
            categoryId,
            name: 'Whiskey',
            code: 101,
            price: 200,
        });

        jest.spyOn(productRepository, 'findById').mockResolvedValueOnce(existingProduct);
        jest.spyOn(productRepository, 'save').mockRejectedValue(new Error('Unexpected error'));

        await expect(updateProductService.execute({actor, payload})).rejects.toThrowWithMessage(
            Error,
            'Unexpected error'
        );
    });

    it('should throw an error when the product does not exist', async () => {
        const payload: UpdateProductDto = {
            id: ProductId.generate(),
            name: 'New name',
        };

        jest.spyOn(productRepository, 'findById').mockResolvedValueOnce(null);

        await expect(updateProductService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Product not found'
        );
    });
});
