import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {PreconditionException} from '../../../../domain/@shared/exceptions';
import {CompanyId} from '../../../../domain/company/entities';
import type {EventDispatcher} from '../../../../domain/event';
import {Product} from '../../../../domain/product/entities';
import {ProductCreatedEvent} from '../../../../domain/product/events';
import {DuplicateCodeException} from '../../../../domain/product/product.exceptions';
import type {ProductRepository} from '../../../../domain/product/product.repository';
import {ProductCategoryId} from '../../../../domain/product-category/entities';
import {UserId} from '../../../../domain/user/entities';
import type {CreateProductDto} from '../../dtos';
import {ProductDto} from '../../dtos';
import {CreateProductService} from '../create-product.service';

describe('A create-product service', () => {
    const productRepository = mock<ProductRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const createProductService = new CreateProductService(productRepository, eventDispatcher);

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

    it('should create a product', async () => {
        const payload: CreateProductDto = {
            companyId,
            categoryId,
            name: 'Whiskey',
            price: 200,
            code: 101,
        };

        const product = Product.create({
            companyId,
            categoryId,
            name: 'Vodka',
            price: 100,
            code: 102,
        });

        jest.spyOn(Product, 'create').mockReturnValue(product);

        await expect(createProductService.execute({actor, payload})).resolves.toEqual(new ProductDto(product));

        expect(Product.create).toHaveBeenCalledWith(payload);

        expect(product.events[0]).toBeInstanceOf(ProductCreatedEvent);
        expect(product.events).toEqual([
            {
                type: ProductCreatedEvent.type,
                product,
                companyId,
                timestamp: now,
            },
        ]);

        expect(productRepository.save).toHaveBeenCalledWith(product);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, product);
    });

    it('should throw an error if the product code is already in use', async () => {
        const payload: CreateProductDto = {
            companyId,
            categoryId,
            name: 'Whiskey',
            price: 200,
            code: 101,
        };

        const product = Product.create({
            companyId,
            categoryId,
            name: 'Vodka',
            price: 100,
            code: 101,
        });

        jest.spyOn(Product, 'create').mockReturnValue(product);
        jest.spyOn(productRepository, 'save').mockRejectedValue(new DuplicateCodeException('Duplicated code'));

        await expect(createProductService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot create a product with a code already in use.'
        );
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error when failing to save the product', async () => {
        const payload: CreateProductDto = {
            companyId,
            categoryId,
            name: 'Whiskey',
            price: 200,
            code: 101,
        };

        const product = Product.create({
            companyId,
            categoryId,
            name: 'Vodka',
            price: 100,
            code: 101,
        });

        jest.spyOn(Product, 'create').mockReturnValue(product);
        jest.spyOn(productRepository, 'save').mockRejectedValue(new Error('Unexpected error'));

        await expect(createProductService.execute({actor, payload})).rejects.toThrowWithMessage(
            Error,
            'Unexpected error'
        );
    });
});
