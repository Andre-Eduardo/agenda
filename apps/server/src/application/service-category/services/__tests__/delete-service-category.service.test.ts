import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {EventDispatcher} from '../../../../domain/event';
import {ServiceCategoryId} from '../../../../domain/service-category/entities';
import {fakeServiceCategory} from '../../../../domain/service-category/entities/__tests__/fake-service-category';
import {ServiceCategoryDeletedEvent} from '../../../../domain/service-category/events';
import type {ServiceCategoryRepository} from '../../../../domain/service-category/service-category.repository';
import {UserId} from '../../../../domain/user/entities';
import type {DeleteServiceCategoryDto} from '../../dtos';
import {DeleteServiceCategoryService} from '../delete-service-category.service';

describe('A delete-service-category.service', () => {
    const serviceCategoryRepository = mock<ServiceCategoryRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const deleteServiceCategoryService = new DeleteServiceCategoryService(serviceCategoryRepository, eventDispatcher);

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

    it('should delete a service category', async () => {
        const existingServiceCategory = fakeServiceCategory();

        const payload: DeleteServiceCategoryDto = {
            id: existingServiceCategory.id,
        };

        jest.spyOn(serviceCategoryRepository, 'findById').mockResolvedValueOnce(existingServiceCategory);

        await deleteServiceCategoryService.execute({actor, payload});

        expect(existingServiceCategory.events).toHaveLength(1);
        expect(existingServiceCategory.events[0]).toBeInstanceOf(ServiceCategoryDeletedEvent);
        expect(existingServiceCategory.events).toEqual([
            {
                type: ServiceCategoryDeletedEvent.type,
                serviceCategory: existingServiceCategory,
                companyId: existingServiceCategory.companyId,
                timestamp: now,
            },
        ]);

        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingServiceCategory);
    });

    it('should throw an error when the service category does not exist', async () => {
        const payload: DeleteServiceCategoryDto = {
            id: ServiceCategoryId.generate(),
        };

        jest.spyOn(serviceCategoryRepository, 'findById').mockResolvedValueOnce(null);

        await expect(deleteServiceCategoryService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Service category not found'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
