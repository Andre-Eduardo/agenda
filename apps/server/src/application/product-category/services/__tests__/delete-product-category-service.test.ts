import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {EventDispatcher} from '../../../../domain/event';
import {ProductCategoryId} from '../../../../domain/product-category/entities';
import {fakeProductCategory} from '../../../../domain/product-category/entities/__tests__/fake-product-category';
import {ProductCategoryDeletedEvent} from '../../../../domain/product-category/events';
import type {ProductCategoryRepository} from '../../../../domain/product-category/product-category.repository';
import {UserId} from '../../../../domain/user/entities';
import type {DeleteProductCategoryDto} from '../../dtos';
import {DeleteProductCategoryService} from '../delete-product-category.service';

describe('A delete-product-category service', () => {
    const productTypeRepository = mock<ProductCategoryRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const deleteProductTypeService = new DeleteProductCategoryService(productTypeRepository, eventDispatcher);

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

    it('should delete a product category', async () => {
        const existingProductCategory = fakeProductCategory();

        const payload: DeleteProductCategoryDto = {
            id: existingProductCategory.id,
        };

        jest.spyOn(productTypeRepository, 'findById').mockResolvedValueOnce(existingProductCategory);

        await deleteProductTypeService.execute({actor, payload});

        expect(existingProductCategory.events).toHaveLength(1);
        expect(existingProductCategory.events[0]).toBeInstanceOf(ProductCategoryDeletedEvent);
        expect(existingProductCategory.events).toEqual([
            {
                type: ProductCategoryDeletedEvent.type,
                productCategory: existingProductCategory,
                companyId: existingProductCategory.companyId,
                timestamp: now,
            },
        ]);

        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingProductCategory);
    });

    it('should throw an error when the product category does not exist', async () => {
        const payload: DeleteProductCategoryDto = {
            id: ProductCategoryId.generate(),
        };

        jest.spyOn(productTypeRepository, 'findById').mockResolvedValueOnce(null);

        await expect(deleteProductTypeService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Product category not found'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
