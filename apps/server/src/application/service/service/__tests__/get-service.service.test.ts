import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import {ServiceId} from '../../../../domain/service/entities';
import {fakeService} from '../../../../domain/service/entities/__tests__/fake-service';
import type {ServiceRepository} from '../../../../domain/service/service.repository';
import {UserId} from '../../../../domain/user/entities';
import type {GetServiceDto} from '../../dtos';
import {ServiceDto} from '../../dtos';
import {GetServiceService} from '../get-service.service';

describe('A get-service service', () => {
    const serviceRepository = mock<ServiceRepository>();
    const getServiceService = new GetServiceService(serviceRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should find a service by ID', async () => {
        const existingService = fakeService();

        const payload: GetServiceDto = {
            id: existingService.id,
        };

        jest.spyOn(serviceRepository, 'findById').mockResolvedValueOnce(existingService);

        await expect(getServiceService.execute({actor, payload})).resolves.toEqual(new ServiceDto(existingService));

        expect(existingService.events).toHaveLength(0);

        expect(serviceRepository.findById).toHaveBeenCalledWith(payload.id);
    });

    it('should throw an error when the service does not exist', async () => {
        const payload: GetServiceDto = {
            id: ServiceId.generate(),
        };

        jest.spyOn(serviceRepository, 'findById').mockResolvedValueOnce(null);

        await expect(getServiceService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Service not found'
        );
    });
});
