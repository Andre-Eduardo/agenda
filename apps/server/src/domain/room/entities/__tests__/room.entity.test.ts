import {InvalidInputException} from '../../../@shared/exceptions';
import {CompanyId} from '../../../company/entities';
import {RoomCategoryId} from '../../../room-category/entities';
import {RoomChangedEvent, RoomCreatedEvent, RoomDeletedEvent, RoomStateChangedEvent} from '../../events';
import {RoomState} from '../../models/room-state';
import type {CreateRoom} from '../index';
import {Room, RoomId} from '../index';
import {fakeRoom} from './fake-room';

describe('A room', () => {
    const companyId = CompanyId.generate();
    const categoryId = RoomCategoryId.generate();
    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('on creation', () => {
        it('should emit a room-created event', () => {
            const number = 1;

            const room = Room.create({companyId, categoryId, number});

            expect(room.id).toBeInstanceOf(RoomId);
            expect(room.companyId).toBe(companyId);
            expect(room.number).toBe(number);
            expect(room.name).toBeNull();
            expect(room.createdAt).toStrictEqual(now);
            expect(room.updatedAt).toStrictEqual(now);

            expect(room.events).toEqual([
                {
                    type: RoomCreatedEvent.type,
                    companyId,
                    room,
                    timestamp: now,
                },
            ]);
            expect(room.events[0]).toBeInstanceOf(RoomCreatedEvent);
        });

        it.each([
            [{number: 0}, 'Room number must be greater than 0.'],
            [{name: ''}, 'Room name must be at least 1 character long.'],
        ])('should throw an error when receiving invalid data', (input, expectedError) => {
            const room: CreateRoom = {
                companyId,
                categoryId,
                number: 1,
            };

            expect(() => Room.create({...room, ...input})).toThrowWithMessage(InvalidInputException, expectedError);
        });
    });

    describe('on change', () => {
        it('should emit a room-changed event', () => {
            const room = fakeRoom({
                companyId,
                categoryId,
                number: 1,
                name: 'Room 1',
                state: RoomState.VACANT,
            });

            const oldRoom = fakeRoom(room);

            const newNumber = 2;
            const newName = 'Room 2';

            room.change({
                number: newNumber,
                name: newName,
            });

            expect(room.number).toBe(newNumber);
            expect(room.name).toBe(newName);

            expect(room.events).toEqual([
                {
                    type: RoomChangedEvent.type,
                    timestamp: now,
                    companyId: room.companyId,
                    oldState: oldRoom,
                    newState: room,
                },
            ]);

            expect(room.events[0]).toBeInstanceOf(RoomChangedEvent);
        });

        it.each([
            [{number: 0}, 'Room number must be greater than 0.'],
            [{name: ''}, 'Room name must be at least 1 character long.'],
        ])('should throw an error when receiving invalid input', (input, expectedError) => {
            const room = fakeRoom();

            expect(() => room.change(input)).toThrow(expectedError);
        });
    });

    describe('on change state', () => {
        it('should emit a room-state-changed event', () => {
            const room = fakeRoom({
                state: RoomState.VACANT,
                stateSnapshot: null,
            });

            room.changeState(RoomState.OCCUPIED, {foo: 'bar'});

            expect(room.state).toBe(RoomState.OCCUPIED);
            expect(room.stateSnapshot).toEqual({foo: 'bar'});
            expect(room.updatedAt).toEqual(now);

            expect(room.events).toEqual([
                {
                    type: RoomStateChangedEvent.type,
                    timestamp: now,
                    companyId: room.companyId,
                    roomId: room.id,
                    oldState: RoomState.VACANT,
                    newState: RoomState.OCCUPIED,
                },
            ]);

            expect(room.events[0]).toBeInstanceOf(RoomStateChangedEvent);
        });
    });

    describe('on deletion', () => {
        it('should emit a room-deleted event', () => {
            const room = new Room({
                id: RoomId.generate(),
                companyId,
                categoryId,
                number: 1,
                name: 'Room 1',
                state: RoomState.VACANT,
                stateSnapshot: null,
                createdAt: new Date(1000),
                updatedAt: new Date(1000),
            });

            room.delete();

            expect(room.events).toEqual([
                {
                    type: RoomDeletedEvent.type,
                    timestamp: now,
                    companyId: room.companyId,
                    room,
                },
            ]);

            expect(room.events[0]).toBeInstanceOf(RoomDeletedEvent);
        });
    });

    it('should be serializable', () => {
        const room = fakeRoom({
            companyId,
            categoryId,
            number: 1,
            name: 'Room 1',
            state: RoomState.VACANT,
        });

        expect(room.toJSON()).toEqual({
            id: room.id.toJSON(),
            companyId: room.companyId.toJSON(),
            categoryId: room.categoryId.toJSON(),
            number: 1,
            name: 'Room 1',
            state: RoomState.VACANT,
            createdAt: room.createdAt.toJSON(),
            updatedAt: room.updatedAt.toJSON(),
        });
    });
});

describe('A room ID', () => {
    it('can be created from a string', () => {
        const uuid = '0c64d1cb-764d-44eb-bb3a-973a854dd449';
        const id = RoomId.from(uuid);

        expect(id.toString()).toBe(uuid);
    });

    it('can be generated', () => {
        expect(RoomId.generate()).toBeInstanceOf(RoomId);
    });
});
