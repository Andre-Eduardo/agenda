import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import {ProductId} from '../../../../domain/product/entities';
import {fakeProduct} from '../../../../domain/product/entities/__tests__/fake-product';
import type {ProductRepository} from '../../../../domain/product/product.repository';
import {UserId} from '../../../../domain/user/entities';
import type {GetProductDto} from '../../dtos';
import {ProductDto} from '../../dtos';
import {GetProductService} from '../get-product.service';

describe('A get-product service', () => {
    const productRepository = mock<ProductRepository>();
    const getProductService = new GetProductService(productRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should get a product', async () => {
        const existingProduct = fakeProduct();

        const payload: GetProductDto = {
            id: existingProduct.id,
        };

        jest.spyOn(productRepository, 'findById').mockResolvedValueOnce(existingProduct);

        await expect(getProductService.execute({actor, payload})).resolves.toEqual(new ProductDto(existingProduct));

        expect(existingProduct.events).toHaveLength(0);

        expect(productRepository.findById).toHaveBeenCalledWith(payload.id);
    });

    it('should throw an error when the product does not exist', async () => {
        const payload: GetProductDto = {
            id: ProductId.generate(),
        };

        jest.spyOn(productRepository, 'findById').mockResolvedValueOnce(null);

        await expect(getProductService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Product not found'
        );
    });
});
