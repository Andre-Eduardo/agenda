import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {EventDispatcher} from '../../../../domain/event';
import {ProductId} from '../../../../domain/product/entities';
import {fakeProduct} from '../../../../domain/product/entities/__tests__/fake-product';
import {ProductDeletedEvent} from '../../../../domain/product/events';
import type {ProductRepository} from '../../../../domain/product/product.repository';
import {UserId} from '../../../../domain/user/entities';
import type {DeleteProductDto} from '../../dtos';
import {DeleteProductService} from '../delete-product.service';

describe('A delete-product service', () => {
    const productRepository = mock<ProductRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const deleteProductService = new DeleteProductService(productRepository, eventDispatcher);

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

    it('should delete a product', async () => {
        const existingProduct = fakeProduct();

        const payload: DeleteProductDto = {
            id: existingProduct.id,
        };

        jest.spyOn(productRepository, 'findById').mockResolvedValueOnce(existingProduct);

        await deleteProductService.execute({actor, payload});

        expect(existingProduct.events).toHaveLength(1);
        expect(existingProduct.events[0]).toBeInstanceOf(ProductDeletedEvent);
        expect(existingProduct.events).toEqual([
            {
                type: ProductDeletedEvent.type,
                product: existingProduct,
                companyId: existingProduct.companyId,
                timestamp: now,
            },
        ]);
        expect(productRepository.delete).toHaveBeenCalledWith(existingProduct.id);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingProduct);
    });

    it('should throw an error when the product does not exist', async () => {
        const payload: DeleteProductDto = {
            id: ProductId.generate(),
        };

        jest.spyOn(productRepository, 'findById').mockResolvedValueOnce(null);

        await expect(deleteProductService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Product not found'
        );
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
