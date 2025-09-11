import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {PreconditionException} from '../../../../domain/@shared/exceptions';
import {CompanyId} from '../../../../domain/company/entities';
import type {EventDispatcher} from '../../../../domain/event';
import {Room} from '../../../../domain/room/entities';
import {RoomCreatedEvent} from '../../../../domain/room/events';
import {DuplicateNumberException} from '../../../../domain/room/room.exceptions';
import type {RoomRepository} from '../../../../domain/room/room.repository';
import {RoomCategoryId} from '../../../../domain/room-category/entities';
import {UserId} from '../../../../domain/user/entities';
import type {CreateRoomDto} from '../../dtos';
import {RoomDto} from '../../dtos';
import {CreateRoomService} from '../index';

describe('A create-room service', () => {
    const roomRepository = mock<RoomRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const createRoomService = new CreateRoomService(roomRepository, eventDispatcher);

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

    it('should create a room', async () => {
        const payload: CreateRoomDto = {
            companyId,
            categoryId,
            number: 10,
        };

        const room = Room.create({companyId, categoryId, number: 10});

        jest.spyOn(Room, 'create').mockReturnValueOnce(room);

        await expect(createRoomService.execute({actor, payload})).resolves.toEqual(new RoomDto(room));

        expect(Room.create).toHaveBeenCalledWith(payload);

        expect(room.events[0]).toBeInstanceOf(RoomCreatedEvent);
        expect(room.events).toEqual([
            {
                type: RoomCreatedEvent.type,
                timestamp: now,
                companyId: room.companyId,
                room,
            },
        ]);

        expect(roomRepository.save).toHaveBeenCalledWith(room);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, room);
    });

    it('should throw an error if the room number is already in use', async () => {
        const payload: CreateRoomDto = {
            companyId,
            categoryId,
            number: 11,
        };

        const room = Room.create({companyId, categoryId, number: 11});

        jest.spyOn(Room, 'create').mockReturnValueOnce(room);
        jest.spyOn(roomRepository, 'save').mockRejectedValue(new DuplicateNumberException('Duplicated number'));

        await expect(createRoomService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot create a room with a number already in use.'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });

    it('should throw an error when failing to save the room', async () => {
        const payload: CreateRoomDto = {
            companyId,
            categoryId,
            number: 12,
        };

        const room = Room.create({companyId, categoryId, number: 12});

        jest.spyOn(Room, 'create').mockReturnValueOnce(room);
        jest.spyOn(roomRepository, 'save').mockRejectedValue(new Error('Unexpected error'));

        await expect(createRoomService.execute({actor, payload})).rejects.toThrowWithMessage(Error, 'Unexpected error');

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
