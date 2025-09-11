import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import {RoomId} from '../../../../domain/room/entities';
import {fakeRoom} from '../../../../domain/room/entities/__tests__/fake-room';
import type {RoomRepository} from '../../../../domain/room/room.repository';
import {UserId} from '../../../../domain/user/entities';
import type {GetRoomDto} from '../../dtos';
import {RoomDto} from '../../dtos';
import {GetRoomService} from '../get-room.service';

describe('A get-room service', () => {
    const roomRepository = mock<RoomRepository>();
    const getRoomService = new GetRoomService(roomRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should get a room', async () => {
        const existingRoom = fakeRoom();

        const payload: GetRoomDto = {
            id: existingRoom.id,
        };

        jest.spyOn(roomRepository, 'findById').mockResolvedValueOnce(existingRoom);

        await expect(getRoomService.execute({actor, payload})).resolves.toEqual(new RoomDto(existingRoom));

        expect(existingRoom.events).toHaveLength(0);

        expect(roomRepository.findById).toHaveBeenCalledWith(payload.id);
    });

    it('should throw an error when the room does not exist', async () => {
        const payload: GetRoomDto = {
            id: RoomId.generate(),
        };

        jest.spyOn(roomRepository, 'findById').mockResolvedValueOnce(null);

        await expect(getRoomService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Room not found'
        );
    });
});
