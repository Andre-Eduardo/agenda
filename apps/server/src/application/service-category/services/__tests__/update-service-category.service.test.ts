import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {
    DuplicateNameException,
    PreconditionException,
    ResourceNotFoundException,
} from '../../../../domain/@shared/exceptions';
import {CompanyId} from '../../../../domain/company/entities';
import type {EventDispatcher} from '../../../../domain/event';
import {ServiceCategoryId} from '../../../../domain/service-category/entities';
import {fakeServiceCategory} from '../../../../domain/service-category/entities/__tests__/fake-service-category';
import {ServiceCategoryChangedEvent} from '../../../../domain/service-category/events';
import type {ServiceCategoryRepository} from '../../../../domain/service-category/service-category.repository';
import {UserId} from '../../../../domain/user/entities';
import type {UpdateServiceCategoryDto} from '../../dtos';
import {ServiceCategoryDto} from '../../dtos';
import {UpdateServiceCategoryService} from '../update-service-category.service';

describe('An update-service-category service', () => {
    const serviceCategoryRepository = mock<ServiceCategoryRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const updateServiceCategoryService = new UpdateServiceCategoryService(serviceCategoryRepository, eventDispatcher);

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

    it('should update a service category', async () => {
        const existingServiceCategory = fakeServiceCategory();

        const oldCategory = fakeServiceCategory(existingServiceCategory);

        const payload: UpdateServiceCategoryDto = {
            id: existingServiceCategory.id,
            name: 'New name',
        };

        jest.spyOn(serviceCategoryRepository, 'findById').mockResolvedValueOnce(existingServiceCategory);

        const updatedServiceCategory = fakeServiceCategory({
            ...existingServiceCategory,
            ...payload,
            updatedAt: now,
        });

        await expect(updateServiceCategoryService.execute({actor, payload})).resolves.toEqual(
            new ServiceCategoryDto(updatedServiceCategory)
        );

        expect(existingServiceCategory.name).toBe(payload.name);
        expect(existingServiceCategory.updatedAt).toEqual(now);

        expect(existingServiceCategory.events).toHaveLength(1);
        expect(existingServiceCategory.events[0]).toBeInstanceOf(ServiceCategoryChangedEvent);
        expect(existingServiceCategory.events).toEqual([
            {
                type: ServiceCategoryChangedEvent.type,
                companyId: existingServiceCategory.companyId,
                timestamp: now,
                oldState: oldCategory,
                newState: existingServiceCategory,
            },
        ]);

        expect(serviceCategoryRepository.save).toHaveBeenCalledWith(existingServiceCategory);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingServiceCategory);
    });

    it('should throw an error when the service category does not exist', async () => {
        const payload: UpdateServiceCategoryDto = {
            id: ServiceCategoryId.generate(),
            name: 'New name',
        };

        jest.spyOn(serviceCategoryRepository, 'findById').mockResolvedValueOnce(null);

        await expect(updateServiceCategoryService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Service category not found'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error when the service category name is already in use', async () => {
        const payload: UpdateServiceCategoryDto = {
            id: ServiceCategoryId.generate(),
            name: 'Maintenance',
        };

        const existingServiceCategory = fakeServiceCategory({id: payload.id});

        jest.spyOn(serviceCategoryRepository, 'findById').mockResolvedValueOnce(existingServiceCategory);
        jest.spyOn(serviceCategoryRepository, 'save').mockRejectedValue(new DuplicateNameException());

        await expect(updateServiceCategoryService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot update a service category with a name already in use.'
        );
    });

    it('should throw an error when failing to save the service category', async () => {
        const payload: UpdateServiceCategoryDto = {
            id: ServiceCategoryId.generate(),
            name: 'New name',
        };

        const existingCategory = fakeServiceCategory({
            id: payload.id,
            companyId: CompanyId.generate(),
            name: 'Old name',
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        jest.spyOn(serviceCategoryRepository, 'findById').mockResolvedValueOnce(existingCategory);
        jest.spyOn(serviceCategoryRepository, 'save').mockRejectedValue(new Error('Unexpected error'));

        await expect(updateServiceCategoryService.execute({actor, payload})).rejects.toThrowWithMessage(
            Error,
            'Unexpected error'
        );
    });
});
