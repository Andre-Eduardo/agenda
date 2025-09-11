import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {PreconditionException, ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import {CompanyId} from '../../../../domain/company/entities';
import type {EventDispatcher} from '../../../../domain/event';
import {RoomId} from '../../../../domain/room/entities';
import {fakeRoom} from '../../../../domain/room/entities/__tests__/fake-room';
import {RoomChangedEvent} from '../../../../domain/room/events';
import {DuplicateNumberException} from '../../../../domain/room/room.exceptions';
import type {RoomRepository} from '../../../../domain/room/room.repository';
import {RoomCategoryId} from '../../../../domain/room-category/entities';
import {UserId} from '../../../../domain/user/entities';
import type {UpdateRoomDto} from '../../dtos';
import {RoomDto} from '../../dtos';
import {UpdateRoomService} from '../update-room.service';

describe('A update-room service', () => {
    const roomRepository = mock<RoomRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const updateRoomService = new UpdateRoomService(roomRepository, eventDispatcher);

    const companyId = CompanyId.generate();
    const categoryId = RoomCategoryId.generate();

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

    it('should update a room', async () => {
        const existingRoom = fakeRoom({
            name: 'Suite 1',
            number: 1,
            companyId,
            categoryId,
        });

        const oldRoom = fakeRoom(existingRoom);

        const payload: UpdateRoomDto = {
            id: existingRoom.id,
            name: 'New name',
            number: 2,
        };

        jest.spyOn(roomRepository, 'findById').mockResolvedValueOnce(existingRoom);

        const updatedRoom = fakeRoom({
            ...existingRoom,
            ...payload,
            updatedAt: now,
        });

        await expect(updateRoomService.execute({actor, payload})).resolves.toEqual(new RoomDto(updatedRoom));

        expect(existingRoom.name).toBe(payload.name);
        expect(existingRoom.number).toBe(payload.number);
        expect(existingRoom.updatedAt).toEqual(now);

        expect(existingRoom.events).toHaveLength(1);
        expect(existingRoom.events[0]).toBeInstanceOf(RoomChangedEvent);
        expect(existingRoom.events).toEqual([
            {
                type: RoomChangedEvent.type,
                companyId: existingRoom.companyId,
                timestamp: now,
                oldState: oldRoom,
                newState: existingRoom,
            },
        ]);

        expect(roomRepository.save).toHaveBeenCalledWith(existingRoom);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingRoom);
    });

    it('should throw an error when the room number is already in use', async () => {
        const payload: UpdateRoomDto = {
            id: RoomId.generate(),
            name: 'New name',
            number: 2,
        };

        const existingRoom = fakeRoom({
            id: payload.id,
            name: 'Existing Room',
            number: 2,
            companyId,
            categoryId,
        });

        jest.spyOn(roomRepository, 'findById').mockResolvedValueOnce(existingRoom);
        jest.spyOn(roomRepository, 'save').mockImplementationOnce(() => {
            throw new DuplicateNumberException();
        });

        await expect(updateRoomService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot update a room with a number already in use.'
        );
    });

    it('should throw an error when failing to save the room', async () => {
        const payload: UpdateRoomDto = {
            id: RoomId.generate(),
            name: 'New name',
        };

        const existingRoom = fakeRoom({
            id: payload.id,
            name: 'Existing Room',
            companyId,
            categoryId,
        });

        jest.spyOn(roomRepository, 'findById').mockResolvedValueOnce(existingRoom);
        jest.spyOn(roomRepository, 'save').mockRejectedValue(new Error('Unexpected error'));

        await expect(updateRoomService.execute({actor, payload})).rejects.toThrowWithMessage(Error, 'Unexpected error');
    });

    it('should throw an error when the room does not exist', async () => {
        const payload: UpdateRoomDto = {
            id: RoomId.generate(),
            name: 'New name',
        };

        jest.spyOn(roomRepository, 'findById').mockResolvedValueOnce(null);

        await expect(updateRoomService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Room not found'
        );
    });
});
