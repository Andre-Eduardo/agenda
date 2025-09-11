import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {
    DuplicateNameException,
    PreconditionException,
    ResourceNotFoundException,
} from '../../../../domain/@shared/exceptions';
import type {EventDispatcher} from '../../../../domain/event';
import {RoomCategoryId} from '../../../../domain/room-category/entities';
import {fakeRoomCategory} from '../../../../domain/room-category/entities/__tests__/fake-room-category';
import {RoomCategoryChangedEvent} from '../../../../domain/room-category/events';
import {DuplicateAcronymException} from '../../../../domain/room-category/room-category.exceptions';
import type {RoomCategoryRepository} from '../../../../domain/room-category/room-category.repository';
import {UserId} from '../../../../domain/user/entities';
import type {UpdateRoomCategoryDto} from '../../dtos';
import {RoomCategoryDto} from '../../dtos';
import {UpdateRoomCategoryService} from '../update-room-category.service';

describe('A update-room-category service', () => {
    const roomCategoryRepository = mock<RoomCategoryRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const updateRoomCategoryService = new UpdateRoomCategoryService(roomCategoryRepository, eventDispatcher);

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

    it('should update a room category', async () => {
        const existingCategory = fakeRoomCategory();

        const oldCategory = fakeRoomCategory(existingCategory);

        const payload: UpdateRoomCategoryDto = {
            id: existingCategory.id,
            name: 'New name',
            acronym: 'NN',
            guestCount: 2,
        };

        jest.spyOn(roomCategoryRepository, 'findById').mockResolvedValueOnce(existingCategory);

        const updatedCategory = fakeRoomCategory({
            ...existingCategory,
            ...payload,
            updatedAt: now,
        });

        await expect(updateRoomCategoryService.execute({actor, payload})).resolves.toEqual(
            new RoomCategoryDto(updatedCategory)
        );

        expect(existingCategory.name).toBe(payload.name);
        expect(existingCategory.updatedAt).toEqual(now);

        expect(existingCategory.events).toHaveLength(1);
        expect(existingCategory.events[0]).toBeInstanceOf(RoomCategoryChangedEvent);
        expect(existingCategory.events).toEqual([
            {
                type: RoomCategoryChangedEvent.type,
                companyId: existingCategory.companyId,
                timestamp: now,
                oldState: oldCategory,
                newState: existingCategory,
            },
        ]);

        expect(roomCategoryRepository.save).toHaveBeenCalledWith(existingCategory);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingCategory);
    });

    it('should throw an error when the room category name is already in use', async () => {
        const payload: UpdateRoomCategoryDto = {
            id: RoomCategoryId.generate(),
            name: 'Lush',
            acronym: 'LU',
            guestCount: 2,
        };

        const existingCategory = fakeRoomCategory({
            id: payload.id,
            name: 'Lush',
            acronym: 'LS',
            guestCount: 1,
        });

        jest.spyOn(roomCategoryRepository, 'findById').mockResolvedValueOnce(existingCategory);
        jest.spyOn(roomCategoryRepository, 'save').mockRejectedValueOnce(new DuplicateNameException());

        await expect(updateRoomCategoryService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot update a room category with a name already in use.'
        );
    });

    it('should throw an error when the room category acronym is already in use', async () => {
        const payload: UpdateRoomCategoryDto = {
            id: RoomCategoryId.generate(),
            name: 'New Lush',
            acronym: 'LS',
            guestCount: 2,
        };

        const existingCategory = fakeRoomCategory({
            id: payload.id,
            name: 'Old Lush',
            acronym: 'LS',
            guestCount: 1,
        });

        jest.spyOn(roomCategoryRepository, 'findById').mockResolvedValueOnce(existingCategory);
        jest.spyOn(roomCategoryRepository, 'save').mockImplementationOnce(() => {
            throw new DuplicateAcronymException();
        });

        await expect(updateRoomCategoryService.execute({actor, payload})).rejects.toThrowWithMessage(
            PreconditionException,
            'Cannot update a room category with an acronym already in use.'
        );
    });

    it('should throw an error when failing to save the room category', async () => {
        const payload: UpdateRoomCategoryDto = {
            id: RoomCategoryId.generate(),
            name: 'New name',
            acronym: 'NN',
            guestCount: 2,
        };

        const existingCategory = fakeRoomCategory({
            id: payload.id,
            name: 'Old name',
            acronym: 'OA',
            guestCount: 1,
        });

        jest.spyOn(roomCategoryRepository, 'findById').mockResolvedValueOnce(existingCategory);
        jest.spyOn(roomCategoryRepository, 'save').mockRejectedValue(new Error('Unexpected error'));

        await expect(updateRoomCategoryService.execute({actor, payload})).rejects.toThrowWithMessage(
            Error,
            'Unexpected error'
        );
    });

    it('should throw an error when the room category does not exist', async () => {
        const payload: UpdateRoomCategoryDto = {
            id: RoomCategoryId.generate(),
            name: 'New name',
            acronym: 'NN',
            guestCount: 2,
        };

        jest.spyOn(roomCategoryRepository, 'findById').mockResolvedValueOnce(null);

        await expect(updateRoomCategoryService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Room category not found'
        );

        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
