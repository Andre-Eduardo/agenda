import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {CompanyId} from '../../../../domain/company/entities';
import {ServiceCategoryId} from '../../../../domain/service-category/entities';
import {fakeServiceCategory} from '../../../../domain/service-category/entities/__tests__/fake-service-category';
import {UserId} from '../../../../domain/user/entities';
import type {PaginatedDto} from '../../../@shared/dto';
import {ServiceCategoryDto} from '../../dtos';
import type {
    CreateServiceCategoryService,
    DeleteServiceCategoryService,
    GetServiceCategoryService,
    ListServiceCategoryService,
    UpdateServiceCategoryService,
} from '../../services';
import {ServiceCategoryController} from '../service-category.controller';

describe('A service category controller', () => {
    const createServiceCategoryService = mock<CreateServiceCategoryService>();
    const listServiceCategoryService = mock<ListServiceCategoryService>();
    const getServiceCategoryService = mock<GetServiceCategoryService>();
    const updateServiceCategoryService = mock<UpdateServiceCategoryService>();
    const deleteServiceCategoryService = mock<DeleteServiceCategoryService>();

    const serviceCategoryController = new ServiceCategoryController(
        createServiceCategoryService,
        listServiceCategoryService,
        getServiceCategoryService,
        updateServiceCategoryService,
        deleteServiceCategoryService
    );

    const companyId = CompanyId.generate();
    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    describe('when creating a service category', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload = {
                companyId,
                name: 'Technical support',
            };

            const expectServiceCategory = new ServiceCategoryDto(fakeServiceCategory(payload));

            jest.spyOn(createServiceCategoryService, 'execute').mockResolvedValueOnce(expectServiceCategory);

            await expect(serviceCategoryController.createServiceCategory(actor, payload)).resolves.toEqual(
                expectServiceCategory
            );

            expect(createServiceCategoryService.execute).toHaveBeenCalledWith({actor, payload});
        });
    });

    describe('when listing service categories', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload = {
                companyId,
                name: 'Service',
                pagination: {
                    limit: 10,
                },
            };

            const serviceCategories = [fakeServiceCategory(), fakeServiceCategory()];

            const expectedResult: PaginatedDto<ServiceCategoryDto> = {
                data: serviceCategories.map((serviceCategory) => new ServiceCategoryDto(serviceCategory)),
                totalCount: 2,
                nextCursor: null,
            };

            jest.spyOn(listServiceCategoryService, 'execute').mockResolvedValueOnce(expectedResult);

            await expect(serviceCategoryController.listServiceCategory(actor, payload)).resolves.toEqual(
                expectedResult
            );

            expect(listServiceCategoryService.execute).toHaveBeenCalledWith({actor, payload});
        });
    });

    describe('when getting a service category', () => {
        it('should repass the responsibility to the right service', async () => {
            const serviceCategory = fakeServiceCategory();

            const expectedServiceCategory = new ServiceCategoryDto(serviceCategory);

            jest.spyOn(getServiceCategoryService, 'execute').mockResolvedValueOnce(expectedServiceCategory);

            await expect(serviceCategoryController.getServiceCategory(actor, serviceCategory.id)).resolves.toEqual(
                expectedServiceCategory
            );

            expect(getServiceCategoryService.execute).toHaveBeenCalledWith({
                actor,
                payload: {id: serviceCategory.id},
            });
        });
    });

    describe('when updating a service category', () => {
        it('should repass the responsibility to the right service', async () => {
            const existingServiceCategory = fakeServiceCategory({companyId, name: 'maintenance'});

            const payload = {
                name: 'Maintenance',
            };

            const expectedServiceCategory = new ServiceCategoryDto(existingServiceCategory);

            jest.spyOn(updateServiceCategoryService, 'execute').mockResolvedValueOnce(expectedServiceCategory);

            await expect(
                serviceCategoryController.updateServiceCategory(actor, existingServiceCategory.id, payload)
            ).resolves.toEqual(expectedServiceCategory);

            expect(updateServiceCategoryService.execute).toHaveBeenCalledWith({
                actor,
                payload: {id: existingServiceCategory.id, ...payload},
            });
        });
    });

    describe('when deleting a service category', () => {
        it('should repass the responsibility to the right service', async () => {
            const id = ServiceCategoryId.generate();

            await serviceCategoryController.deleteServiceCategory(actor, id);

            expect(deleteServiceCategoryService.execute).toHaveBeenCalledWith({actor, payload: {id}});
        });
    });
});
