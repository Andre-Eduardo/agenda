import {CompanyId} from '../../../company/entities';
import {ServiceCategoryChangedEvent, ServiceCategoryCreatedEvent, ServiceCategoryDeletedEvent} from '../../events';
import {ServiceCategory, ServiceCategoryId} from '../service-category.entity';
import {fakeServiceCategory} from './fake-service-category';

describe('A service category', () => {
    const now = new Date();
    const companyId = CompanyId.generate();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('on creation', () => {
        it('should emit a service-category-created event', () => {
            const name = 'Cleaning';

            const serviceCategory = ServiceCategory.create({companyId, name});

            expect(serviceCategory.name).toBe(name);

            expect(serviceCategory.events).toEqual([
                {
                    type: ServiceCategoryCreatedEvent.type,
                    companyId: serviceCategory.companyId,
                    timestamp: now,
                    serviceCategory,
                },
            ]);

            expect(serviceCategory.events[0]).toBeInstanceOf(ServiceCategoryCreatedEvent);
        });
    });

    describe('on change', () => {
        it('should emit a service-category-changed event', () => {
            const serviceCategory = fakeServiceCategory({companyId, name: 'Old name'});

            const oldServiceCategory = fakeServiceCategory(serviceCategory);

            serviceCategory.change({name: 'Technical support'});

            expect(serviceCategory.name).toBe('Technical support');

            expect(serviceCategory.updatedAt).toEqual(now);

            expect(serviceCategory.events).toEqual([
                {
                    type: ServiceCategoryChangedEvent.type,
                    companyId: serviceCategory.companyId,
                    timestamp: now,
                    oldState: oldServiceCategory,
                    newState: serviceCategory,
                },
            ]);

            expect(serviceCategory.events[0]).toBeInstanceOf(ServiceCategoryChangedEvent);
        });

        it('should throw an error when receiving invalid data', () => {
            const serviceCategory = fakeServiceCategory({name: 'Technical support'});

            expect(() => serviceCategory.change({name: ''})).toThrow(
                'Service category name must be at least 1 character long.'
            );
        });
    });

    describe('on delete', () => {
        it('should emit a service-category-deleted event', () => {
            const serviceCategory = fakeServiceCategory();

            serviceCategory.delete();

            expect(serviceCategory.events).toEqual([
                {
                    type: ServiceCategoryDeletedEvent.type,
                    serviceCategory,
                    companyId: serviceCategory.companyId,
                    timestamp: now,
                },
            ]);

            expect(serviceCategory.events[0]).toBeInstanceOf(ServiceCategoryDeletedEvent);
        });
    });

    it('should be serializable', () => {
        const serviceCategory = fakeServiceCategory({name: 'Cleaning'});

        expect(serviceCategory.toJSON()).toEqual({
            id: serviceCategory.id.toJSON(),
            companyId: serviceCategory.companyId.toJSON(),
            name: serviceCategory.name,
            createdAt: serviceCategory.createdAt.toJSON(),
            updatedAt: serviceCategory.updatedAt.toJSON(),
        });
    });
});

describe('A service-category ID', () => {
    it('can be created from a string', () => {
        const uuid = '6267dbfa-177a-4596-882e-99572932ffce';
        const id = ServiceCategoryId.from(uuid);

        expect(id.toString()).toBe(uuid);
    });

    it('can be generated', () => {
        expect(ServiceCategoryId.generate()).toBeInstanceOf(ServiceCategoryId);
    });
});
