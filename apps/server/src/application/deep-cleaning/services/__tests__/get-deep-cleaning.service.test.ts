import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {DeepCleaningRepository} from '../../../../domain/deep-cleaning/deep-cleaning.repository';
import {fakeDeepCleaning} from '../../../../domain/deep-cleaning/entities/__tests__/fake-deep-cleaning';
import {RoomStatusId} from '../../../../domain/room-status/entities';
import {UserId} from '../../../../domain/user/entities';
import type {GetDeepCleaningDto} from '../../dtos';
import {DeepCleaningDto} from '../../dtos';
import {GetDeepCleaningService} from '../get-deep-cleaning.service';

describe('A get-deep-cleaning service', () => {
    const deepCleaningRepository = mock<DeepCleaningRepository>();
    const getDeepCleaningService = new GetDeepCleaningService(deepCleaningRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should get a deep cleaning', async () => {
        const existingDeepCleaning = fakeDeepCleaning();
        const payload: GetDeepCleaningDto = {
            id: existingDeepCleaning.id,
        };

        jest.spyOn(deepCleaningRepository, 'findById').mockResolvedValueOnce(existingDeepCleaning);

        await expect(getDeepCleaningService.execute({actor, payload})).resolves.toEqual(
            new DeepCleaningDto(existingDeepCleaning)
        );

        expect(existingDeepCleaning.events).toHaveLength(0);
        expect(deepCleaningRepository.findById).toHaveBeenCalledWith(payload.id);
    });

    it('should throw an error when the deep cleaning does not exist', async () => {
        const payload: GetDeepCleaningDto = {
            id: RoomStatusId.generate(),
        };

        jest.spyOn(deepCleaningRepository, 'findById').mockResolvedValueOnce(null);

        await expect(getDeepCleaningService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Deep cleaning not found'
        );
    });
});
