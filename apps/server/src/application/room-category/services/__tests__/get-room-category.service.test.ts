import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import {RoomCategoryId} from '../../../../domain/room-category/entities';
import {fakeRoomCategory} from '../../../../domain/room-category/entities/__tests__/fake-room-category';
import type {RoomCategoryRepository} from '../../../../domain/room-category/room-category.repository';
import {UserId} from '../../../../domain/user/entities';
import type {GetRoomCategoryDto} from '../../dtos';
import {RoomCategoryDto} from '../../dtos';
import {GetRoomCategoryService} from '../get-room-category.service';

describe('A get-room-category service', () => {
    const roomCategoryRepository = mock<RoomCategoryRepository>();
    const getRoomCategoryService = new GetRoomCategoryService(roomCategoryRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should get a room category', async () => {
        const existingCategory = fakeRoomCategory();

        const payload: GetRoomCategoryDto = {
            id: existingCategory.id,
        };

        jest.spyOn(roomCategoryRepository, 'findById').mockResolvedValueOnce(existingCategory);

        await expect(getRoomCategoryService.execute({actor, payload})).resolves.toEqual(
            new RoomCategoryDto(existingCategory)
        );

        expect(existingCategory.events).toHaveLength(0);

        expect(roomCategoryRepository.findById).toHaveBeenCalledWith(payload.id);
    });

    it('should throw an error when the room category does not exist', async () => {
        const payload: GetRoomCategoryDto = {
            id: RoomCategoryId.generate(),
        };

        jest.spyOn(roomCategoryRepository, 'findById').mockResolvedValueOnce(null);

        await expect(getRoomCategoryService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Room category not found'
        );
    });
});
