import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {PreconditionException} from '../../../../domain/@shared/exceptions';
import {CompanyId} from '../../../../domain/company/entities';
import type {DeepCleaningRepository} from '../../../../domain/deep-cleaning/deep-cleaning.repository';
import {DeepCleaning} from '../../../../domain/deep-cleaning/entities';
import {fakeDeepCleaning} from '../../../../domain/deep-cleaning/entities/__tests__/fake-deep-cleaning';
import type {EventDispatcher} from '../../../../domain/event';
import {RoomId} from '../../../../domain/room/entities';
import {RoomStateEvent} from '../../../../domain/room/models/room-state';
import type {RoomStateService} from '../../../../domain/room/services';
import {UserId} from '../../../../domain/user/entities';
import type {StartDeepCleaningDto} from '../../dtos';
import {DeepCleaningDto} from '../../dtos';
import {StartDeepCleaningService} from '../start-deep-cleaning.service';

describe('A start-deep-cleaning service', () => {
    const deepCleaningRepository = mock<DeepCleaningRepository>();
    const roomStateService = mock<RoomStateService>();
    const eventDispatcher = mock<EventDispatcher>();
    const startDeepCleaningService = new StartDeepCleaningService(
        deepCleaningRepository,
        roomStateService,
        eventDispatcher
    );

    const companyId = CompanyId.generate();
    const roomId = RoomId.generate();

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should start a deep cleaning', async () => {
        const payload: StartDeepCleaningDto = {
            companyId,
            roomId,
        };

        const deepCleaning = fakeDeepCleaning({...payload, startedById: actor.userId});

        jest.spyOn(DeepCleaning, 'start').mockReturnValue(deepCleaning);
        jest.spyOn(deepCleaningRepository, 'findByRoom').mockResolvedValueOnce(null);

        await expect(startDeepCleaningService.execute({actor, payload})).resolves.toEqual(
            new DeepCleaningDto(deepCleaning)
        );

        expect(DeepCleaning.start).toHaveBeenCalledWith({...payload, startedById: actor.userId});

        expect(roomStateService.changeRoomState).toHaveBeenCalledWith(deepCleaning.roomId, {
            type: RoomStateEvent.PERFORM_DEEP_CLEANING,
            deepCleaningTimeout: 3600,
        });

        expect(deepCleaningRepository.save).toHaveBeenCalledWith(deepCleaning);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, deepCleaning);
    });

    it('should fail to start a deep cleaning in a room that is already being deep cleaned', async () => {
        const payload: StartDeepCleaningDto = {
            companyId,
            roomId,
        };

        const deepCleaning = fakeDeepCleaning(payload);

        jest.spyOn(DeepCleaning, 'start').mockReturnValue(deepCleaning);

        await expect(startDeepCleaningService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'There is already a deep cleaning in this room.'
        );

        expect(roomStateService.changeRoomState).not.toHaveBeenCalled();
        expect(deepCleaningRepository.save).not.toHaveBeenCalled();
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error when failing to start the deep cleaning', async () => {
        const payload: StartDeepCleaningDto = {
            companyId,
            roomId,
        };

        const cleaning = fakeDeepCleaning(payload);

        jest.spyOn(DeepCleaning, 'start').mockReturnValue(cleaning);
        jest.spyOn(deepCleaningRepository, 'findByRoom').mockResolvedValueOnce(null);
        jest.spyOn(deepCleaningRepository, 'save').mockRejectedValue(new Error('Unexpected error'));

        await expect(startDeepCleaningService.execute({actor, payload})).rejects.toThrowWithMessage(
            Error,
            'Unexpected error'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
