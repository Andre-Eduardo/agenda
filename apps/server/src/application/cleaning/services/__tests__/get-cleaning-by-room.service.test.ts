import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {CleaningRepository} from '../../../../domain/cleaning/cleaning.repository';
import {fakeCleaning} from '../../../../domain/cleaning/entities/__tests__/fake-cleaning';
import {RoomId} from '../../../../domain/room/entities';
import {UserId} from '../../../../domain/user/entities';
import type {GetCleaningByRoomDto} from '../../dtos';
import {CleaningDto} from '../../dtos/cleaning.dto';
import {GetCleaningByRoomService} from '../get-cleaning-by-room.service';

describe('A get-cleaning-by-room service', () => {
    const cleaningRepository = mock<CleaningRepository>();
    const getCleaningByRoomService = new GetCleaningByRoomService(cleaningRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should get a cleaning by room', async () => {
        const existingCleaning = fakeCleaning();
        const payload: GetCleaningByRoomDto = {
            roomId: existingCleaning.roomId,
        };

        jest.spyOn(cleaningRepository, 'findByRoom').mockResolvedValueOnce(existingCleaning);

        await expect(getCleaningByRoomService.execute({actor, payload})).resolves.toEqual(
            new CleaningDto(existingCleaning)
        );

        expect(existingCleaning.events).toHaveLength(0);
        expect(cleaningRepository.findByRoom).toHaveBeenCalledWith(payload.roomId);
    });

    it('should throw an error when the cleaning does not exist', async () => {
        const payload: GetCleaningByRoomDto = {
            roomId: RoomId.generate(),
        };

        jest.spyOn(cleaningRepository, 'findByRoom').mockResolvedValueOnce(null);

        await expect(getCleaningByRoomService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Cleaning not found in room'
        );
    });
});
