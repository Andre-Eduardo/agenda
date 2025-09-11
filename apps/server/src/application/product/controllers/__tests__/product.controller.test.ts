import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {CompanyId} from '../../../../domain/company/entities';
import {Product, ProductId} from '../../../../domain/product/entities';
import {ProductCategoryId} from '../../../../domain/product-category/entities';
import {UserId} from '../../../../domain/user/entities';
import type {PaginatedDto} from '../../../@shared/dto';
import {ProductDto} from '../../dtos';
import type {
    CreateProductService,
    DeleteProductService,
    GetProductService,
    ListProductService,
    UpdateProductService,
} from '../../services';
import {ProductController} from '../product.controller';

describe('A product controller', () => {
    const createProductServiceMock = mock<CreateProductService>();
    const listProductServiceMock = mock<ListProductService>();
    const getProductServiceMock = mock<GetProductService>();
    const updateProductServiceMock = mock<UpdateProductService>();
    const deleteProductServiceMock = mock<DeleteProductService>();
    const productController = new ProductController(
        createProductServiceMock,
        listProductServiceMock,
        getProductServiceMock,
        updateProductServiceMock,
        deleteProductServiceMock
    );

    const companyId = CompanyId.generate();

    const categoryId = ProductCategoryId.generate();

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    describe('when creating a product', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload = {
                companyId,
                categoryId,
                name: 'Product 101',
                code: 101,
                price: 100,
            };

            const expectedProduct = new ProductDto(Product.create(payload));

            jest.spyOn(createProductServiceMock, 'execute').mockResolvedValueOnce(expectedProduct);

            await expect(productController.createProduct(actor, payload)).resolves.toEqual(expectedProduct);

            expect(createProductServiceMock.execute).toHaveBeenCalledWith({actor, payload});
            expect(listProductServiceMock.execute).not.toHaveBeenCalled();
            expect(getProductServiceMock.execute).not.toHaveBeenCalled();
            expect(updateProductServiceMock.execute).not.toHaveBeenCalled();
            expect(deleteProductServiceMock.execute).not.toHaveBeenCalled();
        });
    });

    describe('when listing products', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload = {
                companyId,
                code: 101,
                pagination: {
                    limit: 2,
                },
            };

            const products = [
                Product.create({
                    companyId,
                    categoryId,
                    code: 101,
                    name: 'Product 101',
                    price: 100,
                }),
                Product.create({
                    companyId,
                    categoryId,
                    code: 102,
                    name: 'Product 102',
                    price: 200,
                }),
            ];

            const expectedProduct: PaginatedDto<ProductDto> = {
                data: products.map((product) => new ProductDto(product)),
                totalCount: 2,
                nextCursor: 'nextCursor',
            };

            jest.spyOn(listProductServiceMock, 'execute').mockResolvedValue(expectedProduct);

            await expect(productController.listProduct(actor, payload)).resolves.toEqual(expectedProduct);

            expect(listProductServiceMock.execute).toHaveBeenCalledWith({actor, payload});
        });
    });

    describe('when getting a product', () => {
        it('should repass the responsibility to the right service', async () => {
            const product = Product.create({
                companyId,
                categoryId,
                name: 'Product 101',
                code: 101,
                price: 100,
            });

            const expectedRoom = new ProductDto(product);

            jest.spyOn(getProductServiceMock, 'execute').mockResolvedValue(expectedRoom);

            await expect(productController.getProduct(actor, product.id)).resolves.toEqual(expectedRoom);

            expect(getProductServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id: product.id}});
        });
    });

    describe('when updating a product', () => {
        it('should repass the responsibility to the right service', async () => {
            const product = Product.create({
                companyId,
                categoryId,
                name: 'Product 101',
                code: 101,
                price: 100,
            });

            const payload = {
                name: 'Product 102',
            };

            const existingProduct = new ProductDto(product);

            jest.spyOn(updateProductServiceMock, 'execute').mockResolvedValueOnce(existingProduct);

            await expect(productController.updateProduct(actor, product.id, payload)).resolves.toEqual(existingProduct);

            expect(updateProductServiceMock.execute).toHaveBeenCalledWith({
                actor,
                payload: {id: product.id, ...payload},
            });
        });
    });

    describe('when deleting a product', () => {
        it('should repass the responsibility to the right service', async () => {
            const id = ProductId.generate();

            await productController.deleteProduct(actor, id);

            expect(deleteProductServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id}});
        });
    });
});
