import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import {ProductCategoryId} from '../../../../domain/product-category/entities';
import {fakeProductCategory} from '../../../../domain/product-category/entities/__tests__/fake-product-category';
import type {ProductCategoryRepository} from '../../../../domain/product-category/product-category.repository';
import {UserId} from '../../../../domain/user/entities';
import type {GetProductCategoryDto} from '../../dtos';
import {ProductCategoryDto} from '../../dtos';
import {GetProductCategoryService} from '../get-product-category.service';

describe('A get-product-category service', () => {
    const productCategoryRepository = mock<ProductCategoryRepository>();
    const getProductCategoryService = new GetProductCategoryService(productCategoryRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should find a product category by ID', async () => {
        const existingProductCategory = fakeProductCategory();

        const payload: GetProductCategoryDto = {
            id: existingProductCategory.id,
        };

        jest.spyOn(productCategoryRepository, 'findById').mockResolvedValueOnce(existingProductCategory);

        await expect(getProductCategoryService.execute({actor, payload})).resolves.toEqual(
            new ProductCategoryDto(existingProductCategory)
        );

        expect(existingProductCategory.events).toHaveLength(0);

        expect(productCategoryRepository.findById).toHaveBeenCalledWith(payload.id);
    });

    it('should throw an error when the product category does not exist', async () => {
        const payload: GetProductCategoryDto = {
            id: ProductCategoryId.generate(),
        };

        jest.spyOn(productCategoryRepository, 'findById').mockResolvedValueOnce(null);

        await expect(getProductCategoryService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Product category not found'
        );
    });
});
