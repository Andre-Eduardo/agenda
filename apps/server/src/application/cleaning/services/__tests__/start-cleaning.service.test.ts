import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {PreconditionException} from '../../../../domain/@shared/exceptions';
import type {CleaningRepository} from '../../../../domain/cleaning/cleaning.repository';
import {Cleaning} from '../../../../domain/cleaning/entities';
import {fakeCleaning} from '../../../../domain/cleaning/entities/__tests__/fake-cleaning';
import {CompanyId} from '../../../../domain/company/entities';
import type {EventDispatcher} from '../../../../domain/event';
import {RoomId} from '../../../../domain/room/entities';
import {RoomStateEvent} from '../../../../domain/room/models/room-state';
import type {RoomStateService} from '../../../../domain/room/services';
import {UserId} from '../../../../domain/user/entities';
import type {StartCleaningDto} from '../../dtos';
import {CleaningDto} from '../../dtos/cleaning.dto';
import {StartCleaningService} from '../start-cleaning.service';

describe('A start-cleaning service', () => {
    const cleaningRepository = mock<CleaningRepository>();
    const roomStateService = mock<RoomStateService>();
    const eventDispatcher = mock<EventDispatcher>();
    const startCleaning = new StartCleaningService(cleaningRepository, roomStateService, eventDispatcher);

    const companyId = CompanyId.generate();
    const roomId = RoomId.generate();

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should start a cleaning', async () => {
        const payload: StartCleaningDto = {
            companyId,
            roomId,
        };

        const cleaning = fakeCleaning({...payload, startedById: actor.userId});

        jest.spyOn(Cleaning, 'start').mockReturnValue(cleaning);
        jest.spyOn(cleaningRepository, 'findByRoom').mockResolvedValueOnce(null);

        await expect(startCleaning.execute({actor, payload})).resolves.toEqual(new CleaningDto(cleaning));

        expect(Cleaning.start).toHaveBeenCalledWith({...payload, startedById: actor.userId});

        expect(roomStateService.changeRoomState).toHaveBeenCalledWith(cleaning.roomId, {
            type: RoomStateEvent.PERFORM_CLEANING,
            cleaningTimeout: 60 * 60,
        });

        expect(cleaningRepository.save).toHaveBeenCalledWith(cleaning);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, cleaning);
    });

    it('should throw an error when trying to start a cleaning in a room that is already being cleaned', async () => {
        const payload: StartCleaningDto = {
            companyId,
            roomId,
        };

        const cleaning = fakeCleaning(payload);

        jest.spyOn(cleaningRepository, 'findByRoom').mockResolvedValue(cleaning);

        await expect(startCleaning.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'There is already a cleaning in this room.'
        );

        expect(roomStateService.changeRoomState).not.toHaveBeenCalled();
        expect(cleaningRepository.save).not.toHaveBeenCalled();
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error when failing to start the cleaning', async () => {
        const payload: StartCleaningDto = {
            companyId,
            roomId,
        };

        const cleaning = fakeCleaning(payload);

        jest.spyOn(Cleaning, 'start').mockReturnValue(cleaning);
        jest.spyOn(cleaningRepository, 'findByRoom').mockResolvedValueOnce(null);
        jest.spyOn(cleaningRepository, 'save').mockRejectedValue(new Error('Unexpected error'));

        await expect(startCleaning.execute({actor, payload})).rejects.toThrowWithMessage(Error, 'Unexpected error');

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
