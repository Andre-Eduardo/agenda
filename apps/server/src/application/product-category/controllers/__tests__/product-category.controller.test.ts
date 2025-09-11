import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {CompanyId} from '../../../../domain/company/entities';
import {ProductCategory, ProductCategoryId} from '../../../../domain/product-category/entities';
import {UserId} from '../../../../domain/user/entities';
import type {PaginatedDto} from '../../../@shared/dto';
import {ProductCategoryDto} from '../../dtos';
import type {
    CreateProductCategoryService,
    DeleteProductCategoryService,
    GetProductCategoryService,
    ListProductCategoryService,
    UpdateProductCategoryService,
} from '../../services';
import {ProductCategoryController} from '../product-category.controller';

describe('A product category controller', () => {
    const createProductCategoryServiceMock = mock<CreateProductCategoryService>();
    const listProductCategoryServiceMock = mock<ListProductCategoryService>();
    const getProductCategoryServiceMock = mock<GetProductCategoryService>();
    const updateProductCategoryServiceMock = mock<UpdateProductCategoryService>();
    const deleteProductCategoryServiceMock = mock<DeleteProductCategoryService>();
    const productCategoryController = new ProductCategoryController(
        createProductCategoryServiceMock,
        listProductCategoryServiceMock,
        getProductCategoryServiceMock,
        updateProductCategoryServiceMock,
        deleteProductCategoryServiceMock
    );

    const companyId = CompanyId.generate();
    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    describe('when creating a product category', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload = {
                companyId,
                name: 'Decorating',
            };

            const expectedProductCategory = new ProductCategoryDto(ProductCategory.create(payload));

            jest.spyOn(createProductCategoryServiceMock, 'execute').mockResolvedValueOnce(expectedProductCategory);

            await expect(productCategoryController.createProductCategory(actor, payload)).resolves.toEqual(
                expectedProductCategory
            );

            expect(createProductCategoryServiceMock.execute).toHaveBeenCalledWith({actor, payload});
        });
    });

    describe('when listing product categories', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload = {
                companyId,
                name: 'Drinks',
                pagination: {
                    limit: 10,
                },
            };

            const productCategories = [
                ProductCategory.create({companyId, name: 'Drinks'}),
                ProductCategory.create({companyId, name: 'Erotic'}),
            ];

            const expectedResult: PaginatedDto<ProductCategoryDto> = {
                data: productCategories.map((productCategory) => new ProductCategoryDto(productCategory)),
                totalCount: 2,
                nextCursor: null,
            };

            jest.spyOn(listProductCategoryServiceMock, 'execute').mockResolvedValueOnce(expectedResult);

            await expect(productCategoryController.listProductCategory(actor, payload)).resolves.toEqual(
                expectedResult
            );

            expect(listProductCategoryServiceMock.execute).toHaveBeenCalledWith({actor, payload});
        });
    });

    describe('when getting a product category', () => {
        it('should repass the responsibility to the right service', async () => {
            const productCategory = ProductCategory.create({companyId, name: 'Drinks'});

            const expectedProductCategory = new ProductCategoryDto(productCategory);

            jest.spyOn(getProductCategoryServiceMock, 'execute').mockResolvedValueOnce(expectedProductCategory);

            await expect(productCategoryController.getProductCategory(actor, productCategory.id)).resolves.toEqual(
                expectedProductCategory
            );

            expect(getProductCategoryServiceMock.execute).toHaveBeenCalledWith({
                actor,
                payload: {id: productCategory.id},
            });
        });
    });

    describe('when updating a product category', () => {
        it('should repass the responsibility to the right service', async () => {
            const existingProductCategory = ProductCategory.create({
                companyId,
                name: 'Decorating',
            });
            const payload = {
                name: 'Decorating',
            };

            const expectedProductCategory = new ProductCategoryDto(existingProductCategory);

            jest.spyOn(updateProductCategoryServiceMock, 'execute').mockResolvedValueOnce(expectedProductCategory);

            await expect(
                productCategoryController.updateProductCategory(actor, existingProductCategory.id, payload)
            ).resolves.toEqual(expectedProductCategory);

            expect(updateProductCategoryServiceMock.execute).toHaveBeenCalledWith({
                actor,
                payload: {id: existingProductCategory.id, ...payload},
            });
        });
    });

    describe('when deleting a product category', () => {
        it('should repass the responsibility to the right service', async () => {
            const id = ProductCategoryId.generate();

            await productCategoryController.deleteProductCategory(actor, id);

            expect(deleteProductCategoryServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id}});
        });
    });
});
