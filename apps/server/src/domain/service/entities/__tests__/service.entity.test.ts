import {InvalidInputException} from '../../../@shared/exceptions';
import {CompanyId} from '../../../company/entities';
import {ServiceCategoryId} from '../../../service-category/entities';
import {fakeServiceCategory} from '../../../service-category/entities/__tests__/fake-service-category';
import {ServiceChangedEvent, ServiceCreatedEvent, ServiceDeletedEvent} from '../../events';
import type {CreateService} from '../service.entity';
import {Service, ServiceId} from '../service.entity';
import {fakeService} from './fake-service';

describe('A service', () => {
    const companyId = CompanyId.generate();
    const categoryId = ServiceCategoryId.generate();
    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('on creation', () => {
        it('should emit a service-created-event', () => {
            const payload: CreateService = {
                companyId,
                categoryId,
                name: 'Service',
                code: 10,
                price: 150,
            };

            const service = Service.create(payload);

            expect(service.id).toBeInstanceOf(ServiceId);
            expect(service.categoryId).toBeInstanceOf(ServiceCategoryId);
            expect(service.categoryId).toBe(categoryId);
            expect(service.companyId).toBe(companyId);

            expect(service.events).toEqual([
                {
                    type: ServiceCreatedEvent.type,
                    companyId,
                    service,
                    timestamp: now,
                },
            ]);
        });

        it.each([
            [{name: ''}, 'Service name must be at least 1 character long.'],
            [{code: 0}, 'Service code must be greater than 0.'],
            [{code: -9}, 'Service code must be greater than 0.'],
            [{price: -10}, 'Service price must be positive.'],
        ])('should throw an error when receiving invalid value', (input, expectedError) => {
            const service: CreateService = {
                companyId,
                categoryId,
                name: 'Foot spa',
                code: 1,
                price: 100,
            };

            expect(() => Service.create({...service, ...input})).toThrowWithMessage(
                InvalidInputException,
                expectedError
            );
        });
    });

    describe('on change', () => {
        it('should emit a service-changed event', () => {
            const service = fakeService();

            const oldServiceCategory = fakeService(service);

            service.change({name: 'New service', code: 15, price: 49.9});

            expect(service.name).toBe('New service');

            expect(service.events).toEqual([
                {
                    type: ServiceChangedEvent.type,
                    companyId: service.companyId,
                    timestamp: now,
                    oldState: oldServiceCategory,
                    newState: service,
                },
            ]);

            expect(service.events[0]).toBeInstanceOf(ServiceChangedEvent);
        });

        it('should throw an error when receiving invalid data', () => {
            const serviceCategory = fakeServiceCategory({
                id: ServiceCategoryId.generate(),
                name: 'Technical support',
            });

            expect(() => serviceCategory.change({name: ''})).toThrow(
                'Service category name must be at least 1 character long.'
            );
        });
    });

    describe('on update', () => {
        it('should emit a service-changed-event', () => {
            const service = fakeService({companyId});

            const oldService = fakeService(service);
            const newCategoryId = ServiceCategoryId.generate();

            service.change({
                name: 'New service',
                categoryId: newCategoryId,
            });

            expect(service.name).toBe('New service');
            expect(service.categoryId).toBe(newCategoryId);

            expect(service.events).toEqual([
                {
                    type: ServiceChangedEvent.type,
                    timestamp: now,
                    companyId,
                    oldState: oldService,
                    newState: service,
                },
            ]);

            expect(service.events[0]).toBeInstanceOf(ServiceChangedEvent);
        });
    });

    describe('on delete', () => {
        it('should emit a service-deleted-event', () => {
            const service = fakeService({
                companyId,
            });

            service.delete();

            expect(service.events).toEqual([
                {
                    type: ServiceDeletedEvent.type,
                    companyId,
                    service,
                    timestamp: now,
                },
            ]);

            expect(service.events[0]).toBeInstanceOf(ServiceDeletedEvent);
        });
    });

    it('should be serializable', () => {
        const service = fakeService();

        expect(service.toJSON()).toEqual({
            id: service.id.toString(),
            companyId: service.companyId.toJSON(),
            categoryId: service.categoryId.toJSON(),
            name: service.name,
            code: service.code,
            price: service.price,
            createdAt: new Date(1000).toJSON(),
            updatedAt: new Date(1000).toJSON(),
        });
    });

    describe('A service ID', () => {
        it('can be created from a string', () => {
            const uuid = '0c64d1cb-764d-44eb-bb3a-973a854dd449';
            const id = ServiceId.from(uuid);

            expect(id.toString()).toBe(uuid);
        });

        it('can be generated', () => {
            expect(ServiceId.generate()).toBeInstanceOf(ServiceId);
        });
    });
});
