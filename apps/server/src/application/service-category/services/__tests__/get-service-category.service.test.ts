import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import {ServiceCategoryId} from '../../../../domain/service-category/entities';
import {fakeServiceCategory} from '../../../../domain/service-category/entities/__tests__/fake-service-category';
import type {ServiceCategoryRepository} from '../../../../domain/service-category/service-category.repository';
import {UserId} from '../../../../domain/user/entities';
import type {GetServiceCategoryDto} from '../../dtos';
import {ServiceCategoryDto} from '../../dtos';
import {GetServiceCategoryService} from '../get-service-category.service';

describe('A get-service-category service', () => {
    const serviceCategoryRepository = mock<ServiceCategoryRepository>();
    const getServiceCategoryService = new GetServiceCategoryService(serviceCategoryRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should find a service category by ID', async () => {
        const existingServiceCategory = fakeServiceCategory();

        const payload: GetServiceCategoryDto = {
            id: existingServiceCategory.id,
        };

        jest.spyOn(serviceCategoryRepository, 'findById').mockResolvedValueOnce(existingServiceCategory);

        await expect(getServiceCategoryService.execute({actor, payload})).resolves.toEqual(
            new ServiceCategoryDto(existingServiceCategory)
        );

        expect(existingServiceCategory.events).toHaveLength(0);

        expect(serviceCategoryRepository.findById).toHaveBeenCalledWith(payload.id);
    });

    it('should throw an error when the service category does not exist', async () => {
        const payload: GetServiceCategoryDto = {
            id: ServiceCategoryId.generate(),
        };

        jest.spyOn(serviceCategoryRepository, 'findById').mockResolvedValueOnce(null);

        await expect(getServiceCategoryService.execute({actor, payload})).rejects.toThrow(ResourceNotFoundException);
    });
});
