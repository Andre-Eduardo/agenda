import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import {CompanyId} from '../../../../domain/company/entities';
import type {Product} from '../../../../domain/product/entities';
import {fakeProduct} from '../../../../domain/product/entities/__tests__/fake-product';
import type {ProductRepository} from '../../../../domain/product/product.repository';
import {ProductCategoryId} from '../../../../domain/product-category/entities';
import {UserId} from '../../../../domain/user/entities';
import type {ListProductDto} from '../../dtos';
import {ProductDto} from '../../dtos';
import {ListProductService} from '../list-product.service';

describe('A list-product service', () => {
    const productRepository = mock<ProductRepository>();
    const listProductService = new ListProductService(productRepository);

    const companyId = CompanyId.generate();
    const categoryId = ProductCategoryId.generate();

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should list products', async () => {
        const existingProduct = [
            fakeProduct({
                companyId,
                categoryId,
                name: 'Whiskey',
                code: 101,
                price: 200,
            }),
            fakeProduct({
                companyId,
                categoryId,
                name: 'Vodka',
                code: 102,
                price: 100,
            }),
        ];

        const paginatedProducts: PaginatedList<Product> = {
            data: existingProduct,
            totalCount: existingProduct.length,
            nextCursor: null,
        };

        const payload: ListProductDto = {
            companyId,
            pagination: {
                limit: 2,
                sort: {name: 'asc'},
            },
            name: 'name',
        };

        jest.spyOn(productRepository, 'search').mockResolvedValueOnce(paginatedProducts);

        await expect(listProductService.execute({actor, payload})).resolves.toEqual({
            data: existingProduct.map((product) => new ProductDto(product)),
            totalCount: existingProduct.length,
            nextCursor: null,
        });
        expect(existingProduct.flatMap((product) => product.events)).toHaveLength(0);

        expect(productRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                limit: 2,
                sort: {name: 'asc'},
            },
            {
                name: 'name',
            }
        );
    });

    it('should paginate products', async () => {
        const existingProduct = [
            fakeProduct({
                companyId,
                categoryId,
                name: 'Whiskey',
                code: 101,
                price: 200,
            }),
            fakeProduct({
                companyId,
                categoryId,
                name: 'Vodka',
                code: 102,
                price: 100,
            }),
        ];

        const paginatedProducts: PaginatedList<Product> = {
            data: existingProduct,
            totalCount: existingProduct.length,
            nextCursor: null,
        };

        const payload: ListProductDto = {
            companyId,
            name: 'name',
            pagination: {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
            },
        };

        jest.spyOn(productRepository, 'search').mockResolvedValueOnce(paginatedProducts);

        await expect(listProductService.execute({actor, payload})).resolves.toEqual({
            data: existingProduct.map((product) => new ProductDto(product)),
            totalCount: existingProduct.length,
            nextCursor: null,
        });

        expect(existingProduct.flatMap((product) => product.events)).toHaveLength(0);

        expect(productRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
                sort: {},
            },
            {
                name: 'name',
            }
        );
    });
});
