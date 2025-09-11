import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {DuplicateNameException, PreconditionException} from '../../../../domain/@shared/exceptions';
import {CompanyId} from '../../../../domain/company/entities';
import type {EventDispatcher} from '../../../../domain/event';
import {ProductCategory} from '../../../../domain/product-category/entities';
import {ProductCategoryCreatedEvent} from '../../../../domain/product-category/events';
import type {ProductCategoryRepository} from '../../../../domain/product-category/product-category.repository';
import {UserId} from '../../../../domain/user/entities';
import type {CreateProductCategoryDto} from '../../dtos';
import {ProductCategoryDto} from '../../dtos';
import {CreateProductCategoryService} from '../create-product-category.service';

describe('A create-product-category service', () => {
    const productCategoryRepository = mock<ProductCategoryRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const createProductCategoryService = new CreateProductCategoryService(productCategoryRepository, eventDispatcher);

    const companyId = CompanyId.generate();
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

    it('should create a product category', async () => {
        const payload: CreateProductCategoryDto = {
            companyId,
            name: 'Drinks',
        };

        const productCategory = ProductCategory.create({companyId, name: 'Drinks'});

        jest.spyOn(ProductCategory, 'create').mockReturnValue(productCategory);

        await expect(createProductCategoryService.execute({actor, payload})).resolves.toEqual(
            new ProductCategoryDto(productCategory)
        );

        expect(ProductCategory.create).toHaveBeenCalledWith(payload);

        expect(productCategory.events[0]).toBeInstanceOf(ProductCategoryCreatedEvent);
        expect(productCategory.events).toEqual([
            {
                type: ProductCategoryCreatedEvent.type,
                productCategory,
                companyId,
                timestamp: now,
            },
        ]);

        expect(productCategoryRepository.save).toHaveBeenCalledWith(productCategory);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, productCategory);
    });

    it('should throw an error if the product category name is already in use', async () => {
        const payload: CreateProductCategoryDto = {
            companyId,
            name: 'Erotic',
        };

        const productCategory = ProductCategory.create({
            companyId,
            name: 'Decorating',
        });

        jest.spyOn(ProductCategory, 'create').mockReturnValue(productCategory);
        jest.spyOn(productCategoryRepository, 'save').mockRejectedValue(new DuplicateNameException('Duplicated name'));

        await expect(createProductCategoryService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot create a product category with a name already in use.'
        );
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error when failing to save the product category', async () => {
        const payload: CreateProductCategoryDto = {
            companyId,
            name: 'Erotic',
        };

        const productCategory = ProductCategory.create({
            companyId,
            name: 'Main Dishes',
        });

        jest.spyOn(ProductCategory, 'create').mockReturnValue(productCategory);
        jest.spyOn(productCategoryRepository, 'save').mockRejectedValue(new Error('Unexpected error'));

        await expect(createProductCategoryService.execute({actor, payload})).rejects.toThrowWithMessage(
            Error,
            'Unexpected error'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
