import {InvalidInputException} from '../../../@shared/exceptions';
import {CompanyId} from '../../../company/entities';
import {RoomCategoryChangedEvent, RoomCategoryCreatedEvent} from '../../events';
import type {CreateRoomCategory} from '../room-category.entity';
import {RoomCategory, RoomCategoryId} from '../room-category.entity';
import {fakeRoomCategory} from './fake-room-category';

describe('A room category', () => {
    const now = new Date();
    const companyId = CompanyId.generate();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('on creation', () => {
        it('should emit a room-category-created event', () => {
            const name = 'Royal Garden';
            const acronym = 'RG';
            const guestCount = 2;

            const roomCategory = RoomCategory.create({companyId, name, acronym, guestCount});

            expect(roomCategory.name).toBe(name);
            expect(roomCategory.acronym).toBe(acronym);
            expect(roomCategory.guestCount).toBe(guestCount);

            expect(roomCategory.events).toEqual([
                {
                    type: RoomCategoryCreatedEvent.type,
                    companyId: roomCategory.companyId,
                    timestamp: now,
                    roomCategory,
                },
            ]);
            expect(roomCategory.events[0]).toBeInstanceOf(RoomCategoryCreatedEvent);
        });

        it.each([
            [{name: ''}, 'Room category name must have at least 3 characters.'],
            [{guestCount: 0}, 'Room category guest count must be at least 1.'],
            [{acronym: 'ABC'}, 'Room category acronym must have between 1 and 2 characters.'],
            [{acronym: ''}, 'Room category acronym must have between 1 and 2 characters.'],
        ])('should throw an error when receiving invalid value', (input, expectedError) => {
            const roomCategory: CreateRoomCategory = {
                companyId,
                name: 'Royal Garden',
                acronym: 'RG',
                guestCount: 2,
            };

            expect(() => RoomCategory.create({...roomCategory, ...input})).toThrowWithMessage(
                InvalidInputException,
                expectedError
            );
        });
    });

    describe('on change', () => {
        it('should emit a room-category-changed event', () => {
            const roomCategory = fakeRoomCategory();

            const oldCategory = fakeRoomCategory(roomCategory);

            roomCategory.change({name: 'New name', acronym: 'nn', guestCount: 3});

            expect(roomCategory.name).toBe('New name');
            expect(roomCategory.acronym).toBe('NN');
            expect(roomCategory.guestCount).toBe(3);

            expect(roomCategory.events).toEqual([
                {
                    type: RoomCategoryChangedEvent.type,
                    companyId: roomCategory.companyId,
                    timestamp: now,
                    oldState: oldCategory,
                    newState: roomCategory,
                },
            ]);
            expect(roomCategory.events[0]).toBeInstanceOf(RoomCategoryChangedEvent);
        });

        it.each([
            [{name: ''}, 'Room category name must have at least 3 characters.'],
            [{guestCount: 0}, 'Room category guest count must be at least 1.'],
            [{acronym: 'ABC'}, 'Room category acronym must have between 1 and 2 characters.'],
            [{acronym: ''}, 'Room category acronym must have between 1 and 2 characters.'],
        ])('should throw an error when receiving invalid value', (input, expectedError) => {
            const roomCategory = fakeRoomCategory({
                name: 'Royal Garden',
                acronym: 'RG',
            });

            expect(() => roomCategory.change(input)).toThrowWithMessage(InvalidInputException, expectedError);
        });

        it('should be serializable', () => {
            const roomCategory = fakeRoomCategory({
                name: 'Royal Garden',
                acronym: 'RG',
                guestCount: 2,
            });

            expect(roomCategory.toJSON()).toEqual({
                id: roomCategory.id.toJSON(),
                companyId: roomCategory.companyId.toJSON(),
                name: 'Royal Garden',
                acronym: 'RG',
                guestCount: 2,
                createdAt: roomCategory.createdAt.toJSON(),
                updatedAt: roomCategory.updatedAt.toJSON(),
            });
        });
    });
});

describe('A room category ID', () => {
    it('can be created from a string', () => {
        const uuid = '6267dbfa-177a-4596-882e-99572932ffce';
        const id = RoomCategoryId.from(uuid);

        expect(id.toString()).toBe(uuid);
    });

    it('can be generated', () => {
        expect(RoomCategoryId.generate()).toBeInstanceOf(RoomCategoryId);
    });
});
