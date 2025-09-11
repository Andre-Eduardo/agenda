import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import {CompanyId} from '../../../../domain/company/entities';
import type {ServiceCategory} from '../../../../domain/service-category/entities';
import {fakeServiceCategory} from '../../../../domain/service-category/entities/__tests__/fake-service-category';
import type {ServiceCategoryRepository} from '../../../../domain/service-category/service-category.repository';
import {UserId} from '../../../../domain/user/entities';
import type {ListServiceCategoryDto} from '../../dtos';
import {ServiceCategoryDto} from '../../dtos';
import {ListServiceCategoryService} from '../list-service-category.service';

describe('A list-service-category service', () => {
    const serviceCategoryRepository = mock<ServiceCategoryRepository>();
    const listServiceCategoryService = new ListServiceCategoryService(serviceCategoryRepository);
    const companyId = CompanyId.generate();

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should list service categories', async () => {
        const existingServiceCategories: ServiceCategory[] = [
            fakeServiceCategory({
                companyId,
                name: 'Service category',
            }),
            fakeServiceCategory({
                companyId,
                name: 'Service category 2',
            }),
            fakeServiceCategory({
                companyId,
                name: 'Service category 3',
            }),
        ];

        const paginatedServiceCategories: PaginatedList<ServiceCategory> = {
            data: existingServiceCategories,
            totalCount: existingServiceCategories.length,
            nextCursor: null,
        };

        const payload: ListServiceCategoryDto = {
            companyId,
            pagination: {
                limit: 3,
                sort: {name: 'asc'},
            },
            name: 'Name',
        };

        jest.spyOn(serviceCategoryRepository, 'search').mockResolvedValueOnce(paginatedServiceCategories);

        await expect(listServiceCategoryService.execute({actor, payload})).resolves.toEqual({
            data: existingServiceCategories.map((serviceCategory) => new ServiceCategoryDto(serviceCategory)),
            totalCount: existingServiceCategories.length,
            nextCursor: null,
        });

        expect(existingServiceCategories.flatMap((serviceCategory) => serviceCategory.events)).toHaveLength(0);

        expect(serviceCategoryRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                limit: 3,
                sort: {name: 'asc'},
            },
            {
                name: 'Name',
            }
        );
    });

    it('should paginate service categories', async () => {
        const existingServiceCategories: ServiceCategory[] = [
            fakeServiceCategory({
                companyId,
                name: 'ServiceCategory',
            }),
            fakeServiceCategory({
                companyId,
                name: 'ServiceCategory 2',
            }),
            fakeServiceCategory({
                companyId,
                name: 'ServiceCategory 3',
            }),
        ];

        const paginatedCategories: PaginatedList<ServiceCategory> = {
            data: existingServiceCategories,
            totalCount: existingServiceCategories.length,
            nextCursor: null,
        };

        const payload: ListServiceCategoryDto = {
            companyId,
            name: 'Service Category',
            pagination: {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 3,
            },
        };

        jest.spyOn(serviceCategoryRepository, 'search').mockResolvedValueOnce(paginatedCategories);

        await expect(listServiceCategoryService.execute({actor, payload})).resolves.toEqual({
            data: existingServiceCategories.map((serviceCategory) => new ServiceCategoryDto(serviceCategory)),
            totalCount: existingServiceCategories.length,
            nextCursor: null,
        });

        expect(existingServiceCategories.flatMap((serviceCategory) => serviceCategory.events)).toHaveLength(0);

        expect(serviceCategoryRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 3,
                sort: {},
            },
            {
                name: 'Service Category',
            }
        );
    });
});
