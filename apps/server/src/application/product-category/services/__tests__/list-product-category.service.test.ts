import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import {CompanyId} from '../../../../domain/company/entities';
import type {ProductCategory} from '../../../../domain/product-category/entities';
import {fakeProductCategory} from '../../../../domain/product-category/entities/__tests__/fake-product-category';
import type {ProductCategoryRepository} from '../../../../domain/product-category/product-category.repository';
import {UserId} from '../../../../domain/user/entities';
import type {ListProductCategoryDto} from '../../dtos';
import {ProductCategoryDto} from '../../dtos';
import {ListProductCategoryService} from '../list-product-category.service';

describe('A list-product-category service', () => {
    const productCategoryRepository = mock<ProductCategoryRepository>();
    const listProductCategoryService = new ListProductCategoryService(productCategoryRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const companyId = CompanyId.generate();

    const existingProductCategories: ProductCategory[] = [
        fakeProductCategory({
            companyId,
            name: 'Erotic',
        }),
        fakeProductCategory({
            companyId,
            name: 'Cleaning',
        }),
        fakeProductCategory({
            companyId,
            name: 'Decorating',
        }),
    ];

    it('should list product categories', async () => {
        const paginatedProductCategories: PaginatedList<ProductCategory> = {
            data: existingProductCategories,
            totalCount: existingProductCategories.length,
            nextCursor: null,
        };

        const payload: ListProductCategoryDto = {
            companyId,
            pagination: {
                limit: 3,
                sort: {name: 'asc'},
            },
            name: 'Decorating',
        };

        jest.spyOn(productCategoryRepository, 'search').mockResolvedValueOnce(paginatedProductCategories);

        await expect(listProductCategoryService.execute({actor, payload})).resolves.toEqual({
            data: existingProductCategories.map((productCategory) => new ProductCategoryDto(productCategory)),
            totalCount: existingProductCategories.length,
            nextCursor: null,
        });

        expect(existingProductCategories.flatMap((productCategory) => productCategory.events)).toHaveLength(0);

        expect(productCategoryRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                limit: 3,
                sort: {name: 'asc'},
            },
            {
                name: 'Decorating',
            }
        );
    });

    it('should paginate product categories', async () => {
        const paginatedCategories: PaginatedList<ProductCategory> = {
            data: existingProductCategories,
            totalCount: existingProductCategories.length,
            nextCursor: null,
        };

        const payload: ListProductCategoryDto = {
            companyId,
            name: 'Decorating',
            pagination: {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 3,
            },
        };

        jest.spyOn(productCategoryRepository, 'search').mockResolvedValueOnce(paginatedCategories);

        await expect(listProductCategoryService.execute({actor, payload})).resolves.toEqual({
            data: existingProductCategories.map((productCategory) => new ProductCategoryDto(productCategory)),
            totalCount: existingProductCategories.length,
            nextCursor: null,
        });

        expect(existingProductCategories.flatMap((productCategory) => productCategory.events)).toHaveLength(0);

        expect(productCategoryRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 3,
                sort: {},
            },
            {
                name: 'Decorating',
            }
        );
    });
});
