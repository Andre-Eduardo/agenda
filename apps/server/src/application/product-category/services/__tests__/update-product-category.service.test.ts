import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {
    DuplicateNameException,
    PreconditionException,
    ResourceNotFoundException,
} from '../../../../domain/@shared/exceptions';
import type {EventDispatcher} from '../../../../domain/event';
import {ProductCategoryId} from '../../../../domain/product-category/entities';
import {fakeProductCategory} from '../../../../domain/product-category/entities/__tests__/fake-product-category';
import {ProductCategoryChangedEvent} from '../../../../domain/product-category/events';
import type {ProductCategoryRepository} from '../../../../domain/product-category/product-category.repository';
import {UserId} from '../../../../domain/user/entities';
import type {UpdateProductCategoryDto} from '../../dtos';
import {ProductCategoryDto} from '../../dtos';
import {UpdateProductCategoryService} from '../update-product-category.service';

describe('A update-product-category service', () => {
    const productCategoryRepository = mock<ProductCategoryRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const updateProductCategoryService = new UpdateProductCategoryService(productCategoryRepository, eventDispatcher);

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

    it('should update a product category', async () => {
        const existingProductCategory = fakeProductCategory({
            name: 'Old name',
        });

        const oldCategory = fakeProductCategory(existingProductCategory);

        const payload: UpdateProductCategoryDto = {
            id: existingProductCategory.id,
            name: 'New name',
        };

        jest.spyOn(productCategoryRepository, 'findById').mockResolvedValueOnce(existingProductCategory);

        const updatedCategory = fakeProductCategory({
            ...existingProductCategory,
            ...payload,
            updatedAt: now,
        });

        await expect(updateProductCategoryService.execute({actor, payload})).resolves.toEqual(
            new ProductCategoryDto(updatedCategory)
        );

        expect(existingProductCategory.name).toBe(payload.name);
        expect(existingProductCategory.updatedAt).toEqual(now);

        expect(existingProductCategory.events).toHaveLength(1);
        expect(existingProductCategory.events[0]).toBeInstanceOf(ProductCategoryChangedEvent);
        expect(existingProductCategory.events).toEqual([
            {
                type: ProductCategoryChangedEvent.type,
                companyId: existingProductCategory.companyId,
                timestamp: now,
                oldState: oldCategory,
                newState: existingProductCategory,
            },
        ]);

        expect(productCategoryRepository.save).toHaveBeenCalledWith(existingProductCategory);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingProductCategory);
    });

    it('should throw an error when the product category does not exist', async () => {
        const payload: UpdateProductCategoryDto = {
            id: ProductCategoryId.generate(),
            name: 'New name',
        };

        jest.spyOn(productCategoryRepository, 'findById').mockResolvedValueOnce(null);

        await expect(updateProductCategoryService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Product category not found'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error when the product category name is already in use', async () => {
        const payload: UpdateProductCategoryDto = {
            id: ProductCategoryId.generate(),
            name: 'Drinks',
        };

        const existingProductCategory = fakeProductCategory({
            id: payload.id,
        });

        jest.spyOn(productCategoryRepository, 'findById').mockResolvedValueOnce(existingProductCategory);
        jest.spyOn(productCategoryRepository, 'save').mockRejectedValue(new DuplicateNameException());

        await expect(updateProductCategoryService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot update a product category with a name already in use.'
        );
    });

    it('should throw an error when failing to save the product category', async () => {
        const payload: UpdateProductCategoryDto = {
            id: ProductCategoryId.generate(),
            name: 'New name',
        };

        const existingCategory = fakeProductCategory({
            id: payload.id,
        });

        jest.spyOn(productCategoryRepository, 'findById').mockResolvedValueOnce(existingCategory);
        jest.spyOn(productCategoryRepository, 'save').mockRejectedValue(new Error('Unexpected error'));

        await expect(updateProductCategoryService.execute({actor, payload})).rejects.toThrowWithMessage(
            Error,
            'Unexpected error'
        );
    });
});
