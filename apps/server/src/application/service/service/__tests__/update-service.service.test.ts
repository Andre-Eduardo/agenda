import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {
    DuplicateNameException,
    PreconditionException,
    ResourceNotFoundException,
} from '../../../../domain/@shared/exceptions';
import type {EventDispatcher} from '../../../../domain/event';
import {ServiceId} from '../../../../domain/service/entities';
import {fakeService} from '../../../../domain/service/entities/__tests__/fake-service';
import {ServiceChangedEvent} from '../../../../domain/service/events';
import {DuplicateCodeException} from '../../../../domain/service/service.exception';
import type {ServiceRepository} from '../../../../domain/service/service.repository';
import {UserId} from '../../../../domain/user/entities';
import type {UpdateServiceDto} from '../../dtos';
import {ServiceDto} from '../../dtos';
import {UpdateServiceService} from '../update-service.service';

describe('A update-service service', () => {
    const serviceRepository = mock<ServiceRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const updateServiceService = new UpdateServiceService(serviceRepository, eventDispatcher);

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

    it('should update a service', async () => {
        const existingService = fakeService();

        const oldService = fakeService(existingService);

        const payload: UpdateServiceDto = {
            id: existingService.id,
            name: 'Updated service',
        };

        jest.spyOn(serviceRepository, 'findById').mockResolvedValueOnce(existingService);

        const updatedService = fakeService({
            ...existingService,
            ...payload,
            updatedAt: now,
        });

        await expect(updateServiceService.execute({actor, payload})).resolves.toEqual(new ServiceDto(updatedService));

        expect(existingService.name).toBe(payload.name);
        expect(existingService.updatedAt).toEqual(now);

        expect(existingService.events).toHaveLength(1);
        expect(existingService.events[0]).toBeInstanceOf(ServiceChangedEvent);
        expect(existingService.events).toEqual([
            {
                type: ServiceChangedEvent.type,
                companyId: existingService.companyId,
                timestamp: now,
                oldState: oldService,
                newState: existingService,
            },
        ]);

        expect(serviceRepository.save).toHaveBeenCalledWith(existingService);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingService);
    });

    it('should throw an error when the service does not exist', async () => {
        const payload: UpdateServiceDto = {
            id: ServiceId.generate(),
            name: 'New name',
        };

        jest.spyOn(serviceRepository, 'findById').mockResolvedValueOnce(null);

        await expect(updateServiceService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Service not found'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error when the service name is already in use', async () => {
        const payload: UpdateServiceDto = {
            id: ServiceId.generate(),
            name: 'New service',
        };

        const existingService = fakeService({name: 'New service'});

        jest.spyOn(serviceRepository, 'findById').mockResolvedValueOnce(existingService);
        jest.spyOn(serviceRepository, 'save').mockRejectedValue(new DuplicateNameException());

        await expect(updateServiceService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot update service with a name already in use.'
        );
    });

    it('should throw an error when the service code is already in use', async () => {
        const payload: UpdateServiceDto = {
            id: ServiceId.generate(),
            name: 'New service',
        };

        const existingService = fakeService({name: 'New service'});

        jest.spyOn(serviceRepository, 'findById').mockResolvedValueOnce(existingService);
        jest.spyOn(serviceRepository, 'save').mockRejectedValue(new DuplicateCodeException());

        await expect(updateServiceService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot update a service with a code already in use.'
        );
    });

    it('should throw an error when failing to save the service', async () => {
        const payload: UpdateServiceDto = {
            id: ServiceId.generate(),
            name: 'New service',
        };

        const existingService = fakeService({name: 'New service'});

        jest.spyOn(serviceRepository, 'findById').mockResolvedValueOnce(existingService);
        jest.spyOn(serviceRepository, 'save').mockRejectedValue(new Error('Unexpected error'));

        await expect(updateServiceService.execute({actor, payload})).rejects.toThrowWithMessage(
            Error,
            'Unexpected error'
        );
    });
});
