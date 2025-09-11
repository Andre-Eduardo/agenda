import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import {CompanyId} from '../../../../domain/company/entities';
import type {Room} from '../../../../domain/room/entities';
import {fakeRoom} from '../../../../domain/room/entities/__tests__/fake-room';
import {RoomState} from '../../../../domain/room/models/room-state';
import type {RoomRepository} from '../../../../domain/room/room.repository';
import {RoomCategoryId} from '../../../../domain/room-category/entities';
import {UserId} from '../../../../domain/user/entities';
import type {ListRoomDto} from '../../dtos';
import {RoomDto} from '../../dtos';
import {ListRoomService} from '../list-room.service';

describe('A list-room service', () => {
    const roomRepository = mock<RoomRepository>();
    const listRoomService = new ListRoomService(roomRepository);

    const companyId = CompanyId.generate();
    const categoryId = RoomCategoryId.generate();

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should list rooms', async () => {
        const existingRoom = [
            fakeRoom({
                name: 'Suite 101',
                number: 101,
                companyId,
                categoryId,
                state: RoomState.VACANT,
            }),
            fakeRoom({
                name: 'Suite 102',
                number: 102,
                companyId,
                categoryId,
                state: RoomState.DIRTY,
            }),
        ];

        const paginatedRooms: PaginatedList<Room> = {
            data: existingRoom,
            totalCount: existingRoom.length,
            nextCursor: null,
        };

        const payload: ListRoomDto = {
            companyId,
            pagination: {
                limit: 2,
                sort: {name: 'asc'},
            },
            name: 'name',
        };

        jest.spyOn(roomRepository, 'search').mockResolvedValueOnce(paginatedRooms);

        await expect(listRoomService.execute({actor, payload})).resolves.toEqual({
            data: existingRoom.map((room) => new RoomDto(room)),
            totalCount: existingRoom.length,
            nextCursor: null,
        });
        expect(existingRoom.flatMap((room) => room.events)).toHaveLength(0);

        expect(roomRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                limit: 2,
                sort: {name: 'asc'},
            },
            {
                name: 'name',
            }
        );
    });

    it('should paginate rooms', async () => {
        const existingRoom = [
            fakeRoom({
                name: 'Suite 103',
                number: 103,
                companyId,
                categoryId,
                state: RoomState.VACANT,
            }),
            fakeRoom({
                name: 'Suite 103',
                number: 103,
                companyId,
                categoryId,
                state: RoomState.DIRTY,
            }),
        ];

        const paginatedRooms: PaginatedList<Room> = {
            data: existingRoom,
            totalCount: existingRoom.length,
            nextCursor: null,
        };

        const payload: ListRoomDto = {
            companyId,
            name: 'name',
            pagination: {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
            },
        };

        jest.spyOn(roomRepository, 'search').mockResolvedValueOnce(paginatedRooms);

        await expect(listRoomService.execute({actor, payload})).resolves.toEqual({
            data: existingRoom.map((room) => new RoomDto(room)),
            totalCount: existingRoom.length,
            nextCursor: null,
        });

        expect(existingRoom.flatMap((room) => room.events)).toHaveLength(0);

        expect(roomRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
                sort: {},
            },
            {
                name: 'name',
            }
        );
    });
});
