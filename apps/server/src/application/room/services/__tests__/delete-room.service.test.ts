import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {EventDispatcher} from '../../../../domain/event';
import {RoomId} from '../../../../domain/room/entities';
import {fakeRoom} from '../../../../domain/room/entities/__tests__/fake-room';
import {RoomDeletedEvent} from '../../../../domain/room/events';
import type {RoomRepository} from '../../../../domain/room/room.repository';
import {UserId} from '../../../../domain/user/entities';
import {DeleteRoomService} from '../delete-room.service';

describe('A delete-room service', () => {
    const roomRepository = mock<RoomRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const deleteRoomService = new DeleteRoomService(roomRepository, eventDispatcher);

    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should delete a room', async () => {
        const existingRoom = fakeRoom();

        const payload = {
            id: existingRoom.id,
        };

        jest.spyOn(roomRepository, 'findById').mockResolvedValueOnce(existingRoom);

        await deleteRoomService.execute({actor, payload});

        expect(existingRoom.events).toHaveLength(1);
        expect(existingRoom.events[0]).toBeInstanceOf(RoomDeletedEvent);
        expect(existingRoom.events).toEqual([
            {
                type: RoomDeletedEvent.type,
                timestamp: now,
                companyId: existingRoom.companyId,
                room: existingRoom,
            },
        ]);

        expect(roomRepository.delete).toHaveBeenCalledWith(existingRoom.id);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingRoom);
    });

    it('should throw an error when the room does not exist', async () => {
        const payload = {
            id: RoomId.generate(),
        };

        jest.spyOn(roomRepository, 'findById').mockResolvedValueOnce(null);

        await expect(deleteRoomService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Room not found'
        );
    });
});
