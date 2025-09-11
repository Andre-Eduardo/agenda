import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {CleaningRepository} from '../../../../domain/cleaning/cleaning.repository';
import {CleaningEndReasonType} from '../../../../domain/cleaning/entities';
import {fakeCleaning} from '../../../../domain/cleaning/entities/__tests__/fake-cleaning';
import {CleaningFinishedEvent} from '../../../../domain/cleaning/events';
import type {EventDispatcher} from '../../../../domain/event';
import {Inspection} from '../../../../domain/inspection/entities';
import {fakeInspection} from '../../../../domain/inspection/entities/__tests__/fake-inspection';
import type {InspectionRepository} from '../../../../domain/inspection/inspection.repository';
import {RoomId} from '../../../../domain/room/entities';
import {RoomStateEvent} from '../../../../domain/room/models/room-state';
import type {RoomStateService} from '../../../../domain/room/services';
import {RoomStatusId} from '../../../../domain/room-status/entities';
import {UserId} from '../../../../domain/user/entities';
import type {FinishCleaningDto} from '../../dtos';
import {FinishCleaningService} from '../finish-cleaning.service';

describe('A finish-cleaning service', () => {
    const cleaningRepository = mock<CleaningRepository>();
    const inspectionRepository = mock<InspectionRepository>();
    const roomStateService = mock<RoomStateService>();
    const eventDispatcher = mock<EventDispatcher>();
    const finishCleaning = new FinishCleaningService(
        cleaningRepository,
        inspectionRepository,
        roomStateService,
        eventDispatcher
    );

    const id = RoomStatusId.generate();
    const roomId = RoomId.generate();

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const now = new Date(1000);

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should finish a cleaning and create an inspection afterwards', async () => {
        const payload: FinishCleaningDto = {
            roomId,
            endReason: CleaningEndReasonType.FINISHED,
        };

        const cleaning = fakeCleaning({id, roomId: payload.roomId, endReason: payload.endReason});

        const inspection = fakeInspection({
            startedById: actor.userId,
            companyId: cleaning.companyId,
            roomId: cleaning.roomId,
        });

        jest.spyOn(cleaningRepository, 'findById').mockResolvedValueOnce(cleaning);
        jest.spyOn(Inspection, 'start').mockReturnValueOnce(inspection);
        jest.spyOn(cleaningRepository, 'findByRoom').mockResolvedValueOnce(cleaning);

        await finishCleaning.execute({actor, payload});

        expect(cleaning.finishedById).toEqual(actor.userId);
        expect(cleaning.endReason).toEqual(payload.endReason);
        expect(cleaning.finishedAt).toEqual(now);

        expect(cleaning.events).toHaveLength(1);
        expect(cleaning.events[0]).toBeInstanceOf(CleaningFinishedEvent);
        expect(cleaning.events).toEqual([
            {
                type: CleaningFinishedEvent.type,
                companyId: cleaning.companyId,
                cleaningId: cleaning.id,
                finishedById: actor.userId,
                endReason: cleaning.endReason,
                timestamp: now,
            },
        ]);

        expect(roomStateService.changeRoomState).toHaveBeenCalledWith(cleaning.roomId, {
            type: RoomStateEvent.COMPLETE_CLEANING,
            autoRentWhenCarInGarage: false,
            inspectionEnabled: true,
            inspectionTimeout: 60 * 60,
        });

        expect(cleaningRepository.save).toHaveBeenCalledWith(cleaning);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, cleaning);

        expect(inspectionRepository.save).toHaveBeenCalledWith(inspection);
    });

    it('should cancel a cleaning', async () => {
        const payload: FinishCleaningDto = {
            roomId,
            endReason: CleaningEndReasonType.CANCELED,
        };

        const cleaning = fakeCleaning({id, endReason: payload.endReason});

        jest.spyOn(cleaningRepository, 'findByRoom').mockResolvedValueOnce(cleaning);

        await finishCleaning.execute({actor, payload});

        expect(cleaning.finishedById).toEqual(actor.userId);
        expect(cleaning.endReason).toEqual(payload.endReason);
        expect(cleaning.finishedAt).toEqual(now);
        expect(cleaning.events).toHaveLength(1);
        expect(cleaning.events[0]).toBeInstanceOf(CleaningFinishedEvent);
        expect(cleaning.events).toEqual([
            {
                type: CleaningFinishedEvent.type,
                companyId: cleaning.companyId,
                cleaningId: cleaning.id,
                finishedById: actor.userId,
                endReason: cleaning.endReason,
                timestamp: now,
            },
        ]);

        expect(roomStateService.changeRoomState).toHaveBeenCalledWith(cleaning.roomId, {
            type: RoomStateEvent.CANCEL_CLEANING,
        });

        expect(cleaningRepository.save).toHaveBeenCalledWith(cleaning);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, cleaning);
    });

    it('should throw an error when the cleaning does not exist', async () => {
        const payload: FinishCleaningDto = {
            roomId,
            endReason: CleaningEndReasonType.FINISHED,
        };

        jest.spyOn(cleaningRepository, 'findByRoom').mockResolvedValueOnce(null);

        await expect(finishCleaning.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Cleaning not found'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
