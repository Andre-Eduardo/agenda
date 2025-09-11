import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {DeepCleaningRepository} from '../../../../domain/deep-cleaning/deep-cleaning.repository';
import {DeepCleaningEndReasonType} from '../../../../domain/deep-cleaning/entities';
import {fakeDeepCleaning} from '../../../../domain/deep-cleaning/entities/__tests__/fake-deep-cleaning';
import {DeepCleaningFinishedEvent} from '../../../../domain/deep-cleaning/events';
import type {EventDispatcher} from '../../../../domain/event';
import {RoomId} from '../../../../domain/room/entities';
import {RoomStateEvent} from '../../../../domain/room/models/room-state';
import type {RoomStateService} from '../../../../domain/room/services';
import {UserId} from '../../../../domain/user/entities';
import type {FinishDeepCleaningDto} from '../../dtos';
import {FinishDeepCleaningService} from '../finish-deep-cleaning.service';

describe('A finish-deep-cleaning service', () => {
    const deepCleaningRepository = mock<DeepCleaningRepository>();
    const roomStateService = mock<RoomStateService>();
    const eventDispatcher = mock<EventDispatcher>();
    const finishDeepCleaning = new FinishDeepCleaningService(deepCleaningRepository, roomStateService, eventDispatcher);

    const roomId = RoomId.generate();

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

    it('should finish a deep cleaning', async () => {
        const endReason = DeepCleaningEndReasonType.FINISHED;

        const payload: FinishDeepCleaningDto = {
            roomId,
            endReason,
        };

        const deepCleaning = fakeDeepCleaning({roomId, endReason});

        jest.spyOn(deepCleaningRepository, 'findByRoom').mockResolvedValueOnce(deepCleaning);

        await finishDeepCleaning.execute({actor, payload});

        expect(deepCleaning.events).toHaveLength(1);
        expect(deepCleaning.finishedById).toEqual(actor.userId);
        expect(deepCleaning.finishedAt).toEqual(now);
        expect(deepCleaning.events[0]).toBeInstanceOf(DeepCleaningFinishedEvent);
        expect(deepCleaning.events).toEqual([
            {
                type: DeepCleaningFinishedEvent.type,
                companyId: deepCleaning.companyId,
                endReason,
                timestamp: now,
                deepCleaningId: deepCleaning.id,
                finishedById: actor.userId,
            },
        ]);

        expect(roomStateService.changeRoomState).toHaveBeenCalledWith(deepCleaning.roomId, {
            type: RoomStateEvent.COMPLETE_DEEP_CLEANING,
            autoRentWhenCarInGarage: false,
            inspectionEnabled: true,
            inspectionTimeout: 3600,
        });

        expect(deepCleaningRepository.save).toHaveBeenCalledWith(deepCleaning);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, deepCleaning);
    });

    it('should cancel a deep cleaning', async () => {
        const payload: FinishDeepCleaningDto = {
            roomId,
            endReason: DeepCleaningEndReasonType.CANCELED,
        };

        const deepCleaning = fakeDeepCleaning({roomId, endReason: payload.endReason});

        jest.spyOn(deepCleaningRepository, 'findByRoom').mockResolvedValueOnce(deepCleaning);

        await finishDeepCleaning.execute({actor, payload});

        expect(deepCleaning.finishedById).toEqual(actor.userId);
        expect(deepCleaning.endReason).toEqual(payload.endReason);
        expect(deepCleaning.finishedAt).toEqual(now);

        expect(deepCleaning.events).toHaveLength(1);
        expect(deepCleaning.events[0]).toBeInstanceOf(DeepCleaningFinishedEvent);
        expect(deepCleaning.events).toEqual([
            {
                type: DeepCleaningFinishedEvent.type,
                companyId: deepCleaning.companyId,
                deepCleaningId: deepCleaning.id,
                finishedById: actor.userId,
                endReason: deepCleaning.endReason,
                timestamp: now,
            },
        ]);

        expect(roomStateService.changeRoomState).toHaveBeenCalledWith(deepCleaning.roomId, {
            type: RoomStateEvent.CANCEL_DEEP_CLEANING,
        });

        expect(deepCleaningRepository.save).toHaveBeenCalledWith(deepCleaning);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, deepCleaning);
    });

    it('should throw an error when the deep cleaning does not exist', async () => {
        const endReason = DeepCleaningEndReasonType.FINISHED;

        const payload: FinishDeepCleaningDto = {
            roomId,
            endReason,
        };

        jest.spyOn(deepCleaningRepository, 'findByRoom').mockResolvedValueOnce(null);

        await expect(finishDeepCleaning.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Deep cleaning not found'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
