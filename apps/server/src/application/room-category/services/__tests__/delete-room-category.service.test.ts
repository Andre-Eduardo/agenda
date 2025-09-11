import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {EventDispatcher} from '../../../../domain/event';
import {RoomCategoryId} from '../../../../domain/room-category/entities';
import {fakeRoomCategory} from '../../../../domain/room-category/entities/__tests__/fake-room-category';
import {RoomCategoryDeletedEvent} from '../../../../domain/room-category/events';
import type {RoomCategoryRepository} from '../../../../domain/room-category/room-category.repository';
import {UserId} from '../../../../domain/user/entities';
import type {DeleteRoomCategoryDto} from '../../dtos';
import {DeleteRoomCategoryService} from '../delete-room-category.service';

describe('A delete-room-category service', () => {
    const roomCategoryRepository = mock<RoomCategoryRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const deleteRoomCategoryService = new DeleteRoomCategoryService(roomCategoryRepository, eventDispatcher);

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

    it('should delete a room category', async () => {
        const existingCategory = fakeRoomCategory();

        const payload: DeleteRoomCategoryDto = {
            id: existingCategory.id,
        };

        jest.spyOn(roomCategoryRepository, 'findById').mockResolvedValueOnce(existingCategory);

        await deleteRoomCategoryService.execute({actor, payload});

        expect(existingCategory.events).toHaveLength(1);
        expect(existingCategory.events[0]).toBeInstanceOf(RoomCategoryDeletedEvent);
        expect(existingCategory.events).toEqual([
            {
                type: RoomCategoryDeletedEvent.type,
                roomCategory: existingCategory,
                companyId: existingCategory.companyId,
                timestamp: now,
            },
        ]);
        expect(roomCategoryRepository.delete).toHaveBeenCalledWith(existingCategory.id);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingCategory);
    });

    it('should throw an error when the room category does not exist', async () => {
        const payload: DeleteRoomCategoryDto = {
            id: RoomCategoryId.generate(),
        };

        jest.spyOn(roomCategoryRepository, 'findById').mockResolvedValueOnce(null);

        await expect(deleteRoomCategoryService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Room category not found'
        );
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
