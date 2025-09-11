import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {CleaningRepository} from '../../../../domain/cleaning/cleaning.repository';
import {fakeCleaning} from '../../../../domain/cleaning/entities/__tests__/fake-cleaning';
import {RoomStatusId} from '../../../../domain/room-status/entities';
import {UserId} from '../../../../domain/user/entities';
import type {GetCleaningDto} from '../../dtos';
import {CleaningDto} from '../../dtos/cleaning.dto';
import {GetCleaningService} from '../get-cleaning.service';

describe('A get-cleaning service', () => {
    const cleaningRepository = mock<CleaningRepository>();
    const getCleaningService = new GetCleaningService(cleaningRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should get a cleaning', async () => {
        const existingCleaning = fakeCleaning();
        const payload: GetCleaningDto = {
            id: existingCleaning.id,
        };

        jest.spyOn(cleaningRepository, 'findById').mockResolvedValueOnce(existingCleaning);

        await expect(getCleaningService.execute({actor, payload})).resolves.toEqual(new CleaningDto(existingCleaning));

        expect(existingCleaning.events).toHaveLength(0);
        expect(cleaningRepository.findById).toHaveBeenCalledWith(payload.id);
    });

    it('should throw an error when the cleaning does not exist', async () => {
        const payload: GetCleaningDto = {
            id: RoomStatusId.generate(),
        };

        jest.spyOn(cleaningRepository, 'findById').mockResolvedValueOnce(null);

        await expect(getCleaningService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Cleaning not found'
        );
    });
});
