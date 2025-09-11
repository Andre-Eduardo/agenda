import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {DeepCleaningRepository} from '../../../../domain/deep-cleaning/deep-cleaning.repository';
import {fakeDeepCleaning} from '../../../../domain/deep-cleaning/entities/__tests__/fake-deep-cleaning';
import {RoomId} from '../../../../domain/room/entities';
import {UserId} from '../../../../domain/user/entities';
import {DeepCleaningDto} from '../../dtos';
import type {GetDeepCleaningByRoomDto} from '../../dtos/get-deep-cleaning-by-room.dto';
import {GetDeepCleaningByRoomService} from '../get-deep-cleaning-by-room.service';

describe('A get-deep-cleaning-by-room service', () => {
    const deepCleaningRepository = mock<DeepCleaningRepository>();
    const getDeepCleaningByRoomService = new GetDeepCleaningByRoomService(deepCleaningRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should get a deep cleaning by room', async () => {
        const existingDeepCleaning = fakeDeepCleaning();
        const payload: GetDeepCleaningByRoomDto = {
            roomId: existingDeepCleaning.roomId,
        };

        jest.spyOn(deepCleaningRepository, 'findByRoom').mockResolvedValueOnce(existingDeepCleaning);

        await expect(getDeepCleaningByRoomService.execute({actor, payload})).resolves.toEqual(
            new DeepCleaningDto(existingDeepCleaning)
        );

        expect(existingDeepCleaning.events).toHaveLength(0);
        expect(deepCleaningRepository.findByRoom).toHaveBeenCalledWith(payload.roomId);
    });

    it('should throw an error when the deep cleaning does not exist', async () => {
        const payload: GetDeepCleaningByRoomDto = {
            roomId: RoomId.generate(),
        };

        jest.spyOn(deepCleaningRepository, 'findByRoom').mockResolvedValueOnce(null);

        await expect(getDeepCleaningByRoomService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Deep cleaning not found in room'
        );
    });
});
