import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {EventDispatcher} from '../../../../domain/event';
import {InspectionEndReasonType} from '../../../../domain/inspection/entities';
import {fakeInspection} from '../../../../domain/inspection/entities/__tests__/fake-inspection';
import {InspectionFinishedEvent} from '../../../../domain/inspection/events';
import type {InspectionRepository} from '../../../../domain/inspection/inspection.repository';
import {RoomId} from '../../../../domain/room/entities';
import {RoomStateEvent} from '../../../../domain/room/models/room-state';
import type {RoomStateService} from '../../../../domain/room/services';
import {UserId} from '../../../../domain/user/entities';
import type {ApproveInspectionDto} from '../../dtos';
import {InspectionDto} from '../../dtos';
import {ApproveInspectionService} from '../approve-inspection.service';

describe('A approve-inspection service', () => {
    const inspectionRepository = mock<InspectionRepository>();
    const roomStateService = mock<RoomStateService>();
    const eventDispatcher = mock<EventDispatcher>();
    const approveInspectionService = new ApproveInspectionService(
        inspectionRepository,
        roomStateService,
        eventDispatcher
    );

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const finishedById = UserId.generate();
    const roomId = RoomId.generate();
    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should approve an inspection', async () => {
        const existingInspection = fakeInspection({roomId});

        const payload: ApproveInspectionDto = {
            roomId,
            finishedById,
            note: '',
        };

        const approvedInspection = fakeInspection({
            ...existingInspection,
            finishedById,
            note: payload.note,
            endReason: InspectionEndReasonType.APPROVED,
            finishedAt: now,
            updatedAt: now,
        });

        jest.spyOn(inspectionRepository, 'findByRoom').mockResolvedValueOnce(existingInspection);

        await expect(
            approveInspectionService.execute({
                actor,
                payload,
            })
        ).resolves.toEqual(new InspectionDto(approvedInspection));

        expect(existingInspection.events).toHaveLength(1);
        expect(existingInspection.events[0]).toBeInstanceOf(InspectionFinishedEvent);
        expect(existingInspection.events).toEqual([
            {
                type: InspectionFinishedEvent.type,
                companyId: existingInspection.companyId,
                inspectionId: existingInspection.id,
                finishedById,
                endReason: InspectionEndReasonType.APPROVED,
                timestamp: now,
            },
        ]);

        expect(inspectionRepository.findByRoom).toHaveBeenCalledWith(payload.roomId);
        expect(roomStateService.changeRoomState).toHaveBeenCalledWith(payload.roomId, {
            type: RoomStateEvent.APPROVE_INSPECTION,
            autoRentWhenCarInGarage: false,
        });
        expect(inspectionRepository.save).toHaveBeenCalledWith(existingInspection);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingInspection);
    });

    it('should throw an error when the inspection does not exist', async () => {
        const payload: ApproveInspectionDto = {
            roomId,
            finishedById: UserId.generate(),
            note: 'a',
        };

        jest.spyOn(inspectionRepository, 'findByRoom').mockResolvedValueOnce(null);

        await expect(approveInspectionService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Inspection not found'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error when failing to save the inspection', async () => {
        const existingInspection = fakeInspection();

        const payload: ApproveInspectionDto = {
            roomId,
            finishedById: UserId.generate(),
            note: '',
        };

        jest.spyOn(inspectionRepository, 'findByRoom').mockResolvedValueOnce(existingInspection);
        jest.spyOn(inspectionRepository, 'save').mockRejectedValue(new Error('Unexpected error'));

        await expect(approveInspectionService.execute({actor, payload})).rejects.toThrowWithMessage(
            Error,
            'Unexpected error'
        );
    });
});
