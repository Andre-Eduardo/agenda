import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {EventDispatcher} from '../../../../domain/event';
import {ServiceId} from '../../../../domain/service/entities';
import {fakeService} from '../../../../domain/service/entities/__tests__/fake-service';
import {ServiceDeletedEvent} from '../../../../domain/service/events';
import type {ServiceRepository} from '../../../../domain/service/service.repository';
import {UserId} from '../../../../domain/user/entities';
import type {DeleteServiceDto} from '../../dtos';
import {DeleteServiceService} from '../delete-service.service';

describe('A delete-service service', () => {
    const serviceRepository = mock<ServiceRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const deleteServiceService = new DeleteServiceService(serviceRepository, eventDispatcher);

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

    it('should delete a service', async () => {
        const existingService = fakeService();

        const payload: DeleteServiceDto = {
            id: existingService.id,
        };

        jest.spyOn(serviceRepository, 'findById').mockResolvedValueOnce(existingService);

        await deleteServiceService.execute({actor, payload});

        expect(existingService.events).toHaveLength(1);
        expect(existingService.events[0]).toBeInstanceOf(ServiceDeletedEvent);
        expect(existingService.events).toEqual([
            {
                type: ServiceDeletedEvent.type,
                service: existingService,
                companyId: existingService.companyId,
                timestamp: now,
            },
        ]);

        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingService);
    });

    it('should throw an error when the service does not exist', async () => {
        const payload: DeleteServiceDto = {
            id: ServiceId.generate(),
        };

        jest.spyOn(serviceRepository, 'findById').mockResolvedValueOnce(null);

        await expect(deleteServiceService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Service not found'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
