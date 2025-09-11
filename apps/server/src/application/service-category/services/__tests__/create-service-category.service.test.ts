import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {DuplicateNameException, PreconditionException} from '../../../../domain/@shared/exceptions';
import {CompanyId} from '../../../../domain/company/entities';
import type {EventDispatcher} from '../../../../domain/event';
import {ServiceCategory} from '../../../../domain/service-category/entities';
import {ServiceCategoryCreatedEvent} from '../../../../domain/service-category/events';
import type {ServiceCategoryRepository} from '../../../../domain/service-category/service-category.repository';
import {UserId} from '../../../../domain/user/entities';
import type {CreateServiceCategoryDto} from '../../dtos';
import {ServiceCategoryDto} from '../../dtos';
import {CreateServiceCategoryService} from '../create-service-category.service';

describe('A create-service-category service', () => {
    const serviceCategoryRepository = mock<ServiceCategoryRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const createServiceCategoryService = new CreateServiceCategoryService(serviceCategoryRepository, eventDispatcher);

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

    describe('should create a service category', () => {
        it('should create a service category', async () => {
            const payload: CreateServiceCategoryDto = {
                companyId,
                name: 'Maintenance',
            };

            const serviceCategory = ServiceCategory.create(payload);

            jest.spyOn(ServiceCategory, 'create').mockReturnValue(serviceCategory);

            await expect(createServiceCategoryService.execute({actor, payload})).resolves.toEqual(
                new ServiceCategoryDto(serviceCategory)
            );

            expect(serviceCategory.events).toHaveLength(1);
            expect(serviceCategory.events[0]).toBeInstanceOf(ServiceCategoryCreatedEvent);
            expect(serviceCategory.events).toEqual([
                {
                    type: ServiceCategoryCreatedEvent.type,
                    companyId: serviceCategory.companyId,
                    timestamp: now,
                    serviceCategory,
                },
            ]);

            expect(ServiceCategory.create).toHaveBeenCalledWith(payload);

            expect(serviceCategoryRepository.save).toHaveBeenCalledWith(serviceCategory);
            expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, serviceCategory);
        });

        it('should throw an error if the service category name is already in use', async () => {
            const payload: CreateServiceCategoryDto = {
                companyId,
                name: 'Name',
            };

            const serviceCategory = ServiceCategory.create({
                companyId,
                name: 'Name',
            });

            jest.spyOn(ServiceCategory, 'create').mockReturnValue(serviceCategory);
            jest.spyOn(serviceCategoryRepository, 'save').mockRejectedValue(
                new DuplicateNameException('Duplicated name')
            );

            await expect(createServiceCategoryService.execute({actor, payload})).rejects.toThrowWithMessage(
                PreconditionException,
                'Cannot create a service category with a name already in use.'
            );
            expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
        });

        it('should throw an error when failing to save the service category', async () => {
            const payload: CreateServiceCategoryDto = {
                companyId,
                name: 'Cleaning',
            };

            const serviceCategory = ServiceCategory.create({
                companyId,
                name: 'Cleaning',
            });

            jest.spyOn(ServiceCategory, 'create').mockReturnValue(serviceCategory);
            jest.spyOn(serviceCategoryRepository, 'save').mockRejectedValue(new Error('Unexpected error'));

            await expect(createServiceCategoryService.execute({actor, payload})).rejects.toThrowWithMessage(
                Error,
                'Unexpected error'
            );

            expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
        });
    });
});
