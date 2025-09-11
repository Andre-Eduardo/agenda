import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {DuplicateNameException, PreconditionException} from '../../../../domain/@shared/exceptions';
import {CompanyId} from '../../../../domain/company/entities';
import type {EventDispatcher} from '../../../../domain/event';
import type {CreateService} from '../../../../domain/service/entities';
import {Service} from '../../../../domain/service/entities';
import {fakeService} from '../../../../domain/service/entities/__tests__/fake-service';
import {ServiceCreatedEvent} from '../../../../domain/service/events';
import {DuplicateCodeException} from '../../../../domain/service/service.exception';
import type {ServiceRepository} from '../../../../domain/service/service.repository';
import {ServiceCategoryId} from '../../../../domain/service-category/entities';
import {UserId} from '../../../../domain/user/entities';
import type {CreateServiceDto} from '../../dtos';
import {ServiceDto} from '../../dtos';
import {CreateServiceService} from '../create-service.service';

describe('A create-service service', () => {
    const serviceRepository = mock<ServiceRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const createServiceService = new CreateServiceService(serviceRepository, eventDispatcher);

    const companyId = CompanyId.generate();
    const categoryId = ServiceCategoryId.generate();

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

    it('should create a service', async () => {
        const payload: CreateServiceDto = {
            companyId,
            categoryId,
            name: 'A new service',
            code: 145,
            price: 199,
        };

        const service = Service.create(payload);

        jest.spyOn(Service, 'create').mockReturnValue(service);

        await expect(createServiceService.execute({actor, payload})).resolves.toEqual(new ServiceDto(service));

        expect(Service.create).toHaveBeenCalledWith(payload);

        expect(service.events).toHaveLength(1);
        expect(service.events[0]).toBeInstanceOf(ServiceCreatedEvent);
        expect(service.events).toEqual([
            {
                type: ServiceCreatedEvent.type,
                service,
                companyId: service.companyId,
                timestamp: now,
            },
        ]);

        expect(serviceRepository.save).toHaveBeenCalledWith(service);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, service);
    });

    it('should throw an error if the service name is already in use', async () => {
        const payload: CreateServiceDto = {
            companyId,
            categoryId,
            name: 'Massage',
            code: 15,
            price: 89,
        };

        jest.spyOn(serviceRepository, 'save').mockRejectedValueOnce(new DuplicateNameException('Duplicated name'));

        await expect(createServiceService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot create a service with a name already in use.'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error if the service code is already in use', async () => {
        const payload: CreateServiceDto = {
            companyId,
            categoryId,
            name: 'Special decorating',
            code: 9,
            price: 185,
        };

        jest.spyOn(serviceRepository, 'save').mockImplementation(() => {
            throw new DuplicateCodeException('Duplicated code');
        });

        await expect(createServiceService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot create a service with a code already in use.'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error when failing to save the service', async () => {
        const payload: CreateService = {
            companyId,
            categoryId,
            name: 'Cleaning',
            code: 1,
            price: 200,
        };

        const service = fakeService();

        jest.spyOn(Service, 'create').mockReturnValue(service);
        jest.spyOn(serviceRepository, 'save').mockRejectedValue(new Error('Unexpected error'));

        await expect(createServiceService.execute({actor, payload})).rejects.toThrowWithMessage(
            Error,
            'Unexpected error'
        );
    });
});
